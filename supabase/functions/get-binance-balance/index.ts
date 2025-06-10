
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Fetching credentials for user:', userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: credentials, error: credError } = await supabase
      .from('user_binance_credentials')
      .select('api_key_encrypted, secret_key_encrypted')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (credError || !credentials) {
      console.error('No credentials found:', credError)
      return new Response(
        JSON.stringify({ 
          error: 'Credenciais da Binance não encontradas',
          details: 'Configure suas credenciais da Binance primeiro na aba Configurações'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { api_key_encrypted: apiKey, secret_key_encrypted: secretKey } = credentials
    
    console.log('Testing Binance connection with API Key:', apiKey.substring(0, 8) + '...')

    // Testar conectividade básica primeiro
    try {
      const basicTest = await fetch('https://api.binance.com/api/v3/time')
      if (!basicTest.ok) {
        console.error('Basic connectivity test failed:', basicTest.status)
        return new Response(
          JSON.stringify({ 
            error: 'Erro de conectividade com a Binance',
            details: 'Não foi possível conectar com a API da Binance'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (connectError) {
      console.error('Network connectivity error:', connectError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro de conectividade',
          details: 'Problema de rede. Verifique sua conexão com a internet.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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
          error: 'Erro na criação da assinatura',
          details: 'Problema com a Secret Key. Verifique se está correta.'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const binanceUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Making request to Binance API...')
    
    let response
    let data
    
    try {
      response = await fetch(binanceUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json'
        }
      })

      data = await response.json()
      console.log('Binance API Response status:', response.status)
    } catch (fetchError) {
      console.error('Error making request to Binance:', fetchError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro de comunicação com a Binance',
          details: 'Falha na requisição para a API da Binance'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!response.ok) {
      console.error('Binance API Error:', data)
      
      let errorMessage = 'Erro na API da Binance'
      let details = 'Erro desconhecido'
      
      if (data.code === -2015) {
        errorMessage = 'Credenciais da Binance inválidas'
        details = 'Verifique se suas credenciais estão corretas e se têm as permissões necessárias:\n• Permissão "Spot & Margin Trading" habilitada\n• API Key ativa\n• Sem restrições de IP ou IP na whitelist'
      } else if (data.code === -1021) {
        errorMessage = 'Erro de sincronização de tempo'
        details = 'Problema de timestamp. Tente novamente em alguns segundos.'
      } else if (data.code === -1022) {
        errorMessage = 'Assinatura inválida'
        details = 'Problema com a Secret Key. Verifique se está correta.'
      } else if (data.code === -2014) {
        errorMessage = 'API Key desabilitada'
        details = 'Sua API Key está desabilitada. Verifique na sua conta Binance.'
      } else if (data.msg) {
        details = data.msg
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: details,
          binanceError: data
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!data.balances || !Array.isArray(data.balances)) {
      console.error('No balances data in response')
      return new Response(
        JSON.stringify({ 
          error: 'Dados de saldo não encontrados',
          details: 'A resposta da Binance não contém informações de saldo válidas'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing balances...')
    
    // Buscar preços atuais
    let prices = []
    try {
      const pricesResponse = await fetch('https://api.binance.com/api/v3/ticker/price')
      
      if (!pricesResponse.ok) {
        console.error('Failed to fetch prices:', pricesResponse.status)
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao buscar preços das criptomoedas',
            details: 'Não foi possível obter os preços atuais'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      prices = await pricesResponse.json()
    } catch (priceError) {
      console.error('Error fetching prices:', priceError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar preços',
          details: 'Não foi possível obter os preços atuais das criptomoedas'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    const priceMap = new Map()
    prices.forEach((price: any) => {
      priceMap.set(price.symbol, parseFloat(price.price))
    })
    
    let totalBalance = 0
    const nonZeroBalances = []
    
    for (const balance of data.balances) {
      const asset = balance.asset
      const free = parseFloat(balance.free) || 0
      const locked = parseFloat(balance.locked) || 0
      const total = free + locked
      
      if (total > 0.001) { // Apenas considerar saldos significativos
        nonZeroBalances.push({
          asset,
          free: free.toString(),
          locked: locked.toString(),
          total: total.toString()
        })
        
        if (asset === 'USDT') {
          totalBalance += total
          console.log(`${asset}: ${total} USDT (direto)`)
        } else {
          // Converter para USDT
          const usdtSymbol = `${asset}USDT`
          const btcSymbol = `${asset}BTC`
          
          let usdtValue = 0
          
          if (priceMap.has(usdtSymbol)) {
            usdtValue = total * priceMap.get(usdtSymbol)
            console.log(`${asset}: ${total} * ${priceMap.get(usdtSymbol)} = ${usdtValue} USDT`)
          } else if (priceMap.has(btcSymbol) && priceMap.has('BTCUSDT')) {
            const btcPrice = priceMap.get(btcSymbol)
            const btcToUsdt = priceMap.get('BTCUSDT')
            usdtValue = total * btcPrice * btcToUsdt
            console.log(`${asset}: ${total} * ${btcPrice} * ${btcToUsdt} = ${usdtValue} USDT (via BTC)`)
          } else if (asset === 'BTC' && priceMap.has('BTCUSDT')) {
            usdtValue = total * priceMap.get('BTCUSDT')
            console.log(`${asset}: ${total} * ${priceMap.get('BTCUSDT')} = ${usdtValue} USDT`)
          }
          
          totalBalance += usdtValue
        }
      }
    }

    console.log(`Total balance calculated: ${totalBalance} USDT`)

    return new Response(
      JSON.stringify({ 
        balance: totalBalance,
        balances: nonZeroBalances,
        success: true,
        message: `Saldo atualizado: $${totalBalance.toFixed(2)} USDT`,
        debug: {
          totalAssets: data.balances.length,
          nonZeroAssets: nonZeroBalances.length,
          calculatedTotal: totalBalance,
          accountType: data.accountType
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching Binance balance:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: 'Erro inesperado. Tente novamente em alguns instantes.',
        technicalDetails: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
