import { Router } from 'itty-router'
import jwt from 'jsonwebtoken'

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
}

const google_public_key_url =
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
const router = Router()

// Validate Token
async function validateToken(token) {
    const response = await fetch(google_public_key_url, {
        method: 'GET',
    })
    const responseBody = await response.json()
    const key_list = Object.keys(responseBody)
    let isError = true
    let decoded = ''
    for (let i = 0; i < key_list.length; i++) {
        try {
            if (isError) {
                const cert = responseBody[key_list[i]]
                decoded = jwt.verify(token, cert)
                console.log('This Key Passed > ', decoded)
                isError = false
            }
        } catch (e) {
            //console.log('e > ', e)
            if (e.name == 'TokenExpiredError') {
                isError = false
                decoded = e
            } else if (isError) {
                decoded = e
            }
        }
    }
    return decoded
}

router.get('/users/', async request => {
    const token = Object.fromEntries(request.headers).token
    const decoded = await validateToken(token)
    console.log('decoded > ', JSON.stringify(decoded))
    return new Response(JSON.stringify(decoded), {
        headers: corsHeaders,
    })
})

router.get('/', () => {
    return new Response('Hello, world!')
})

router.all('*', request => {
    const origin = request.headers.get('Origin')
    // You can validate origin here.
    console.log('origin > ', origin)
    if (request.method === 'OPTIONS') {
        // Make sure the necesssary headers are present for this to be a
        // valid pre-flight request
        if (
            request.headers.get('Origin') !== null &&
            request.headers.get('Access-Control-Request-Method') !== null &&
            request.headers.get('Access-Control-Request-Headers') !== null
        ) {
            // Handle CORS pre-flight request.
            // If you want to check the requested method + headers
            // you can do that here.
            console.log('pre-flight')
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods':
                        'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
            })
        } else {
            // Handle standard OPTIONS request.
            console.log('Standard OPTIONS')
            return new Response(null, {
                headers: {
                    Allow: 'GET, HEAD, OPTIONS',
                },
            })
        }
    } else {
        new Response('404, not found!', { status: 404 })
    }
})

addEventListener('fetch', e => {
    e.respondWith(router.handle(e.request))
})
