
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiKey, secretKey } = await req.json()

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'API Key e Secret Key são obrigatórios' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Validating credentials for API Key:', apiKey.substring(0, 8) + '...')

    // Create signature for Binance API
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(queryString)
    )
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Test Binance API connection with account endpoint
    const binanceUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Testing Binance API connection...')
    
    const response = await fetch(binanceUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    const data = await response.json()
    
    console.log('Binance API Response Status:', response.status)
    console.log('Binance API Response:', data)

    if (response.ok && data.accountType) {
      console.log('Credentials validated successfully')
      return new Response(
        JSON.stringify({ 
          valid: true, 
          accountType: data.accountType,
          message: 'Credenciais validadas com sucesso!'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('Binance API Error:', data)
      
      let errorMessage = 'Credenciais inválidas'
      if (data.code === -2015) {
        errorMessage = 'API Key inválida ou sem permissões. Verifique se a API Key tem permissão "Spot & Margin Trading" ativada.'
      } else if (data.code === -1021) {
        errorMessage = 'Erro de sincronização de tempo. Tente novamente.'
      } else if (data.msg) {
        errorMessage = data.msg
      }
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: errorMessage,
          code: data.code 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error validating Binance credentials:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Erro interno ao validar credenciais. Tente novamente.' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
