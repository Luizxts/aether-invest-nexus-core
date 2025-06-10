
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Binance credentials validation...')
    
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Dados da requisição inválidos',
          details: 'Formato JSON inválido'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { apiKey, secretKey } = requestBody

    if (!apiKey || !secretKey) {
      console.error('Missing credentials')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'API Key e Secret Key são obrigatórios',
          details: 'Ambas as credenciais devem ser fornecidas'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Validating credentials for API Key:', apiKey.substring(0, 8) + '...')

    // Test basic connectivity first
    console.log('Testing basic connectivity...')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const basicResponse = await fetch('https://api.binance.com/api/v3/time', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Seravat-Trading-Bot/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!basicResponse.ok) {
        console.error('Basic connectivity failed:', basicResponse.status, basicResponse.statusText)
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Erro de conectividade com a Binance',
            details: `Falha na conexão básica: ${basicResponse.status} ${basicResponse.statusText}`
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
          details: 'Não foi possível conectar com os servidores da Binance. Verifique sua conexão.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create signature for authenticated request
    console.log('Creating signature...')
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
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
        
      console.log('Signature created successfully')
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

    // Test authenticated endpoint
    const accountUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Testing authenticated endpoint...')
    
    let response
    let data
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      response = await fetch(accountUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Seravat-Trading-Bot/1.0'
        }
      })

      clearTimeout(timeoutId)
      
      console.log('Binance API Response Status:', response.status)

      data = await response.json()
      console.log('Binance API Response received')
    } catch (fetchError) {
      console.error('Error making request to Binance:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Timeout na conexão com a Binance',
            details: 'A requisição demorou muito para responder. Tente novamente.'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
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

    // Process response
    if (response.ok && data && data.accountType) {
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
      
      if (data && data.code) {
        switch (data.code) {
          case -2015:
            errorMessage = 'API Key inválida ou sem permissões necessárias'
            helpMessage = 'Verifique se:\n• A API Key está correta\n• Tem permissão "Spot & Margin Trading" habilitada\n• Não há restrições de IP (ou o IP está na whitelist)\n• A Secret Key está correta'
            break
          case -1021:
            errorMessage = 'Erro de sincronização de tempo'
            helpMessage = 'Tente novamente em alguns segundos'
            break
          case -1022:
            errorMessage = 'Assinatura inválida'
            helpMessage = 'Verifique se a Secret Key está correta'
            break
          case -2014:
            errorMessage = 'API Key inválida ou desabilitada'
            helpMessage = 'Verifique se a API Key está ativa e bem formada'
            break
          default:
            if (data.msg) {
              errorMessage = data.msg
            }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: errorMessage,
          help: helpMessage,
          code: data?.code || 'UNKNOWN'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error validating Binance credentials:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Erro interno do servidor',
        details: 'Erro inesperado durante a validação. Tente novamente.',
        technical: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
