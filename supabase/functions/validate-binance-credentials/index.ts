
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Starting Binance credentials validation ===')
    
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
    console.log('Request data received:', { 
      hasApiKey: !!apiKey, 
      hasSecretKey: !!secretKey,
      apiKeyLength: apiKey?.length,
      secretKeyLength: secretKey?.length
    })

    if (!apiKey || !secretKey) {
      console.error('Missing credentials in request')
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

    // Trim whitespace and validate format
    const cleanApiKey = apiKey.trim()
    const cleanSecretKey = secretKey.trim()

    console.log('Cleaned credentials:', {
      cleanApiKeyLength: cleanApiKey.length,
      cleanSecretKeyLength: cleanSecretKey.length,
      apiKeyPreview: cleanApiKey.substring(0, 8) + '...'
    })

    // Validate API key format
    if (cleanApiKey.length !== 64) {
      console.error('Invalid API key format - wrong length:', cleanApiKey.length)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Formato da API Key inválido',
          details: `A API Key deve ter exatamente 64 caracteres (atual: ${cleanApiKey.length})`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate secret key format
    if (cleanSecretKey.length !== 64) {
      console.error('Invalid secret key format - wrong length:', cleanSecretKey.length)
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Formato da Secret Key inválido',
          details: `A Secret Key deve ter exatamente 64 caracteres (atual: ${cleanSecretKey.length})`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for valid characters (alphanumeric)
    const validPattern = /^[a-zA-Z0-9]+$/
    if (!validPattern.test(cleanApiKey)) {
      console.error('Invalid API key format - invalid characters')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Formato da API Key inválido',
          details: 'A API Key deve conter apenas letras e números'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!validPattern.test(cleanSecretKey)) {
      console.error('Invalid secret key format - invalid characters')
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Formato da Secret Key inválido',
          details: 'A Secret Key deve conter apenas letras e números'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== Testing basic Binance connectivity ===')
    
    // Test basic connectivity first
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
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
      
      console.log('✓ Basic connectivity test passed')
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

    console.log('=== Creating HMAC signature ===')
    
    // Create signature for authenticated request
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    console.log('Signature data:', {
      timestamp,
      queryString,
      secretKeyLength: cleanSecretKey.length
    })
    
    let signatureHex = ''
    try {
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(cleanSecretKey),
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
        
      console.log('✓ Signature created successfully:', signatureHex.substring(0, 16) + '...')
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

    console.log('=== Testing authenticated Binance endpoint ===')
    
    // Test authenticated endpoint
    const accountUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Making authenticated request to Binance...')
    console.log('Request URL (partial):', accountUrl.substring(0, 60) + '...')
    console.log('API Key (partial):', cleanApiKey.substring(0, 8) + '...')
    
    let response
    let data
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      response = await fetch(accountUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'X-MBX-APIKEY': cleanApiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Seravat-Trading-Bot/1.0'
        }
      })

      clearTimeout(timeoutId)
      
      console.log('Binance API Response Status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      data = await response.json()
      console.log('Binance API Response received, success:', response.ok)
      if (!response.ok) {
        console.log('Error response data:', data)
      }
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
      console.log('✓ Credentials validated successfully')
      console.log('Account data:', {
        accountType: data.accountType,
        permissions: data.permissions,
        canTrade: data.canTrade,
        canWithdraw: data.canWithdraw,
        canDeposit: data.canDeposit
      })
      
      return new Response(
        JSON.stringify({ 
          valid: true, 
          accountType: data.accountType,
          permissions: data.permissions || [],
          canTrade: data.canTrade || false,
          message: 'Credenciais validadas com sucesso!'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('✗ Binance API Error:', data)
      
      let errorMessage = 'Credenciais inválidas'
      let helpMessage = ''
      
      if (data && data.code) {
        console.log('Binance error code:', data.code, 'message:', data.msg)
        
        switch (data.code) {
          case -2015:
            errorMessage = 'API Key inválida ou sem permissões necessárias'
            helpMessage = `INSTRUÇÕES PARA CORRIGIR O ERRO -2015:

1. VERIFIQUE SUA API KEY:
   • Acesse sua conta Binance → "Gerenciamento de API"
   • Confirme que a API Key está ATIVA (status: Enabled)
   • Se estiver desabilitada, reative-a

2. CONFIGURE AS PERMISSÕES OBRIGATÓRIAS:
   • ✓ Habilite "Spot & Margin Trading" 
   • ✓ Habilite "Leitura" (Read)
   • ✗ NÃO precisa de "Futures" ou "Withdraw"

3. CONFIGURE RESTRIÇÕES DE IP:
   OPÇÃO A: Remover todas as restrições
   • Vá em "Editar restrições de IP"
   • Remova TODOS os IPs da lista
   • Salve com a lista vazia

   OPÇÃO B: Adicionar IPs específicos
   • Adicione estes IPs à whitelist:
     - Seu IP atual
     - 0.0.0.0/0 (permite todos - menos seguro)

4. AGUARDE A PROPAGAÇÃO:
   • Após qualquer alteração, aguarde 5-10 minutos
   • A Binance demora para propagar mudanças

5. VERIFIQUE A API KEY:
   • Certifique-se que copiou TODA a chave (64 caracteres)
   • Não deve ter espaços no início ou fim
   • Teste com uma API Key recém-criada se necessário

6. SE NADA FUNCIONAR:
   • Delete a API Key atual
   • Crie uma nova API Key do zero
   • Configure as permissões novamente
   • Aguarde 10 minutos antes de testar

IMPORTANTE: O erro -2015 geralmente indica problema de permissões ou restrições de IP.`
            break
          case -1021:
            errorMessage = 'Erro de sincronização de tempo'
            helpMessage = 'Tente novamente em alguns segundos. Problema de timestamp.'
            break
          case -1022:
            errorMessage = 'Assinatura inválida'
            helpMessage = 'Verifique se a Secret Key está correta e completa (64 caracteres)'
            break
          case -2014:
            errorMessage = 'API Key inválida'
            helpMessage = 'Verifique se a API Key está correta e ativa na sua conta Binance'
            break
          case -1013:
            errorMessage = 'Filtro inválido'
            helpMessage = 'Problema na configuração da API. Tente recriar as credenciais.'
            break
          default:
            if (data.msg) {
              errorMessage = data.msg
              helpMessage = `Erro da Binance: ${data.msg}. Verifique suas credenciais e configurações.`
            }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: errorMessage,
          help: helpMessage,
          code: data?.code || 'UNKNOWN',
          binanceMessage: data?.msg || 'Erro desconhecido'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error validating Binance credentials:', error)
    console.error('Error stack:', error.stack)
    
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
