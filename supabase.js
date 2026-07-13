const SUPABASE_URL = 'https://ljvzgagjmzajbwuoqaxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqdnpnYWdqbXphamJ3dW9xYXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NjQxODMsImV4cCI6MjA5OTU0MDE4M30.J-KHl7Tjp1nl08nxgHAqc_scQ3dEpEst1otzgEnjNwg';

function isSupabaseConfigured() {
    return Boolean(
        SUPABASE_URL &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_URL.includes('tu-proyecto') &&
        !SUPABASE_ANON_KEY.includes('tu-clave')
    );
}

async function testSupabaseConnection() {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            error: new Error('Supabase no está configurado correctamente.')
        };
    }

    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/participantes?select=id&limit=1`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
                Accept: 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Supabase connection test failed: ${response.status} ${response.statusText} - ${text}`);
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, error };
    }
}

window.supabaseConfig = {
    url: SUPABASE_URL,
    anonKeySet: Boolean(SUPABASE_ANON_KEY),
    anonKeyLength: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.length : 0,
    configured: isSupabaseConfigured(),
    testConnection: testSupabaseConnection
};
console.log('Supabase config loaded:', window.supabaseConfig);

async function saveRegistrationToSupabase(data) {
    if (!isSupabaseConfigured()) {
        return {
            ok: false,
            reason: 'config',
            error: {
                message: 'La configuración de Supabase no está lista.'
            }
        };
    }

    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/participantes`;

    try {
        console.log('Supabase: insertando participante ->', data);

        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                nombre: data.nombre,
                apellido: data.apellido,
                edad: data.edad,
                telefono: data.telefono,
                correo: data.correo
            })
        });

        const responseText = await response.text();
        let responseData = null;

        try {
            responseData = responseText ? JSON.parse(responseText) : null;
        } catch (error) {
            responseData = responseText;
        }

        if (!response.ok) {
            const errorMessage = responseData && typeof responseData === 'object' ?
                (responseData.message || responseData.error_description || responseData.error || response.statusText || 'Error desconocido') :
                (responseData || response.statusText || 'Error desconocido');

            let hint = null;
            if (response.status === 401 || response.status === 403) {
                hint = 'Verifica que la anon key de Supabase sea correcta y que la tabla participantes permita INSERT para el rol anon.';
            }

            throw {
                message: errorMessage,
                status: response.status,
                details: responseData,
                hint
            };
        }

        const participanteData = Array.isArray(responseData) ? responseData[0] : responseData;

        return {
            ok: true,
            data: participanteData
        };
    } catch (error) {
        console.error('Supabase: error en saveRegistrationToSupabase', error);

        return {
            ok: false,
            reason: 'error',
            error: {
                message: error.message || 'Error desconocido',
                details: error.details || null,
                status: error.status || null,
                code: error.code || null
            }
        };
    }
}