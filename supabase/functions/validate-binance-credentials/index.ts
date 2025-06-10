
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
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

    // Primeiro testar conectividade básica com a API da Binance
    try {
      const basicResponse = await fetch('https://api.binance.com/api/v3/time', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!basicResponse.ok) {
        console.error('Basic API connectivity failed:', basicResponse.status)
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Erro de conectividade com a API da Binance',
            details: 'Não foi possível conectar com os servidores da Binance'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      console.log('Basic connectivity test passed')
    } catch (connectError) {
      console.error('Network error during basic connectivity test:', connectError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Erro de conectividade',
          details: 'Não foi possível conectar com a internet ou servidores da Binance'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Agora testar com credenciais
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    // Criar assinatura HMAC
    let signatureHex = ''
    try {
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
      
      signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } catch (sigError) {
      console.error('Error creating signature:', sigError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Erro na criação da assinatura',
          details: 'Secret Key pode estar incorreta ou malformada'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Testar endpoint autenticado
    const accountUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Testing authenticated endpoint...')
    
    let response
    let data
    
    try {
      response = await fetch(accountUrl, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log('Binance API Response Status:', response.status)
      }

      data = await response.json()
      console.log('Binance API Response Data:', JSON.stringify(data, null, 2))
    } catch (fetchError) {
      console.error('Error making request to Binance:', fetchError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Erro de comunicação com a Binance',
          details: 'Falha na requisição para a API da Binance'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (response.ok && data.accountType) {
      console.log('Credentials validated successfully')
      return new Response(
        JSON.stringify({ 
          valid: true, 
          accountType: data.accountType,
          permissions: data.permissions || [],
          message: 'Credenciais validadas com sucesso!'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('Binance API Error:', data)
      
      let errorMessage = 'Credenciais inválidas'
      let helpMessage = ''
      
      if (data.code === -2015) {
        errorMessage = 'API Key inválida ou sem permissões necessárias'
        helpMessage = 'Verifique se:\n• A API Key está correta\n• Tem permissão "Spot & Margin Trading" habilitada\n• Não há restrições de IP (ou o IP está na whitelist)\n• A Secret Key está correta'
      } else if (data.code === -1021) {
        errorMessage = 'Erro de sincronização de tempo'
        helpMessage = 'Tente novamente em alguns segundos'
      } else if (data.code === -1022) {
        errorMessage = 'Assinatura inválida'
        helpMessage = 'Verifique se a Secret Key está correta'
      } else if (data.code === -2014) {
        errorMessage = 'API Key inválida ou desabilitada'
        helpMessage = 'Verifique se a API Key está ativa e bem formada'
      } else if (data.msg) {
        errorMessage = data.msg
      }
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: errorMessage,
          help: helpMessage,
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
        error: 'Erro interno do servidor',
        details: 'Erro inesperado durante a validação. Tente novamente.' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
