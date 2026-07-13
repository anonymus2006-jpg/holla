const STORAGE_KEY = 'inscripcion_app_data';
const defaultData = {
    participantes: []
};

let data = loadData();

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : structuredClone(defaultData);
    } catch (error) {
        console.error(error);
        return structuredClone(defaultData);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    if (!status) return;

    status.textContent = message;
    status.className = `status ${type}`;

    if (type === 'success') {
        clearTimeout(window.statusHideTimer);
        window.statusHideTimer = setTimeout(() => {
            status.className = 'status';
            status.textContent = '';
        }, 5000);
    }
}

function showSupabaseStatus(message, type = 'success') {
    const status = document.getElementById('supabaseStatus');
    if (!status) return;

    status.textContent = message;
    status.className = `status ${type}`;
}

function showWelcomeMessage() {
    const welcome = document.getElementById('welcomeMessage');
    if (!welcome) return;

    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    welcome.textContent = `Hoy es ${today.toLocaleDateString('es-ES', options)}.`;
}

async function debugSupabaseConfig() {
    if (window.supabaseConfig) {
        console.log('Supabase configuration present in browser:', window.supabaseConfig);
        if (!window.supabaseConfig.configured) {
            console.warn('Supabase no está configurado correctamente. Revisa SUPABASE_URL y SUPABASE_ANON_KEY.');
            showSupabaseStatus('Supabase no está configurado correctamente. Revisa supabase.js.', 'error');
            return;
        }

        const result = await window.supabaseConfig.testConnection();
        if (!result.ok) {
            console.warn('Supabase connection test failed:', result.error);
            showSupabaseStatus('No se puede conectar a Supabase desde este sitio. Revisa la URL y anon key en supabase.js.', 'error');
        } else {
            console.log('Supabase connection test passed. GitHub Pages puede guardar en la base de datos.');
        }
    } else {
        console.warn('No se encontró la configuración de Supabase en window.supabaseConfig.');
        showSupabaseStatus('No se encontró la configuración de Supabase. Revisa que supabase.js se cargue correctamente.', 'error');
    }
}

function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

showWelcomeMessage();
debugSupabaseConfig();

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^\+?[0-9-]+$/.test(phone) && phone.length <= 20;
}

function getSupabaseErrorMessage(result) {
    if (result.reason === 'config') {
        return 'La configuración de Supabase no está lista.';
    }

    const error = result.error;
    const message = error && error.message ? error.message : '';
    const code = error && error.code ? error.code : null;
    const status = error && error.status ? error.status : null;

    const isPermissionIssue = code === '42501' || status === 401 || status === 403 || /policy|permission|row level security|insufficient_privilege/i.test(message);

    if (isPermissionIssue) {
        return 'Supabase está bloqueando la inserción. Activa una política de INSERT para la tabla participantes en el panel de Supabase.';
    }

    if (message) {
        return message;
    }

    return 'No se pudo enviar a Supabase.';
}

const form = document.getElementById('inscriptionForm');

if (form) {
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const nombre = document.getElementById('participantNombre').value.trim();
        const apellido = document.getElementById('participantApellido').value.trim();
        const edad = Number(document.getElementById('participantEdad').value);
        const telefono = document.getElementById('participantTelefono').value.trim();
        const correo = document.getElementById('participantCorreo').value.trim();

        if (!nombre || !apellido || !telefono || !correo || Number.isNaN(edad)) {
            showStatus('Complete todos los datos del formulario.', 'error');
            return;
        }

        if (edad < 0 || edad > 120) {
            showStatus('La edad debe estar entre 0 y 120.', 'error');
            return;
        }

        if (!validateEmail(correo)) {
            showStatus('El correo no es válido.', 'error');
            return;
        }

        if (!validatePhone(telefono)) {
            showStatus('El teléfono solo debe contener números y guiones.', 'error');
            return;
        }

        // Asegurar que data.participantes existe
        if (!data.participantes) {
            data.participantes = [];
        }

        data.participantes.push({
            id: createId(),
            nombre,
            apellido,
            edad,
            telefono,
            correo,
            fecha_inscripcion: new Date().toISOString()
        });

        saveData();

        const result = await saveRegistrationToSupabase({
            nombre,
            apellido,
            edad,
            telefono,
            correo
        });

        if (result.ok) {
            this.reset();
            showStatus('Usted se ha inscripto.', 'success');
        } else {
            const errorText = getSupabaseErrorMessage(result);
            const hint = result.error && result.error.hint ? ` Pista: ${result.error.hint}` : '';

            console.error('Supabase error:', result);
            showStatus(
                `Se guardó localmente, pero no se pudo enviar a Supabase: ${errorText}${hint}`,
                'error'
            );
        }
    });
}