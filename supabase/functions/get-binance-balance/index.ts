
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
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Fetching credentials for user:', userId)

    // Create Supabase client with service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's Binance credentials
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
          details: 'Configure suas credenciais da Binance primeiro'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { api_key_encrypted: apiKey, secret_key_encrypted: secretKey } = credentials
    
    console.log('Testing Binance connection with API Key:', apiKey.substring(0, 8) + '...')

    // Test connection first with account info
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

    // Get account information from Binance
    const binanceUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    console.log('Making request to Binance API...')
    
    const response = await fetch(binanceUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    const data = await response.json()
    console.log('Binance API Response status:', response.status)
    console.log('Binance API Response:', data)

    if (!response.ok) {
      console.error('Binance API Error:', data)
      
      let errorMessage = 'Erro na API da Binance'
      let details = data
      
      if (data.code === -2015) {
        errorMessage = 'Credenciais da Binance inválidas'
        details = 'Verifique se sua API Key e Secret Key estão corretas e se têm as permissões necessárias (Spot Trading habilitado)'
      } else if (data.code === -1021) {
        errorMessage = 'Erro de sincronização de tempo'
        details = 'Problema de timestamp. Tente novamente em alguns segundos.'
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

    if (data.balances) {
      // Get current crypto prices to convert to USDT
      console.log('Fetching crypto prices...')
      const pricesResponse = await fetch('https://api.binance.com/api/v3/ticker/price')
      
      if (!pricesResponse.ok) {
        console.error('Failed to fetch prices')
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
      
      const prices = await pricesResponse.json()
      
      // Create a price map for easy lookup
      const priceMap = new Map()
      prices.forEach((price: any) => {
        priceMap.set(price.symbol, parseFloat(price.price))
      })
      
      let totalBalance = 0
      const nonZeroBalances = []
      
      // Process all balances
      for (const balance of data.balances) {
        const asset = balance.asset
        const free = parseFloat(balance.free)
        const locked = parseFloat(balance.locked)
        const total = free + locked
        
        if (total > 0) {
          nonZeroBalances.push({
            asset,
            free: free.toString(),
            locked: locked.toString(),
            total: total.toString()
          })
          
          if (asset === 'USDT') {
            // USDT is already in USDT value
            totalBalance += total
            console.log(`${asset}: ${total} USDT (direct)`)
          } else {
            // Convert other assets to USDT
            const usdtSymbol = `${asset}USDT`
            const btcSymbol = `${asset}BTC`
            
            let usdtValue = 0
            
            // Try direct conversion to USDT
            if (priceMap.has(usdtSymbol)) {
              usdtValue = total * priceMap.get(usdtSymbol)
              console.log(`${asset}: ${total} * ${priceMap.get(usdtSymbol)} = ${usdtValue} USDT`)
            }
            // Try conversion via BTC
            else if (priceMap.has(btcSymbol) && priceMap.has('BTCUSDT')) {
              const btcPrice = priceMap.get(btcSymbol)
              const btcToUsdt = priceMap.get('BTCUSDT')
              usdtValue = total * btcPrice * btcToUsdt
              console.log(`${asset}: ${total} * ${btcPrice} * ${btcToUsdt} = ${usdtValue} USDT (via BTC)`)
            }
            // If it's BTC, convert directly
            else if (asset === 'BTC' && priceMap.has('BTCUSDT')) {
              usdtValue = total * priceMap.get('BTCUSDT')
              console.log(`${asset}: ${total} * ${priceMap.get('BTCUSDT')} = ${usdtValue} USDT`)
            }
            
            totalBalance += usdtValue
          }
        }
      }

      console.log(`Total balance calculated: ${totalBalance} USDT`)
      console.log(`Non-zero balances:`, nonZeroBalances)

      return new Response(
        JSON.stringify({ 
          balance: totalBalance,
          balances: nonZeroBalances,
          success: true,
          message: `Saldo atualizado com sucesso: $${totalBalance.toFixed(2)} USDT`,
          debug: {
            totalAssets: data.balances.length,
            nonZeroAssets: nonZeroBalances.length,
            calculatedTotal: totalBalance
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.error('No balances data in response')
      return new Response(
        JSON.stringify({ 
          error: 'Dados de saldo não encontrados',
          details: 'A resposta da Binance não contém informações de saldo'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error fetching Binance balance:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: 'Erro ao conectar com a Binance. Tente novamente.',
        technicalDetails: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
