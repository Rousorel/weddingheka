import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    deleteField
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autenticación: helpers exportados
export async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutAuth() {
    return firebaseSignOut(auth);
}

export function onAuthStateChangedListener(cb) {
    return onAuthStateChanged(auth, cb);
}
export { auth };

// Función auxiliar para limpiar campos undefined o null
function limpiarObjeto(obj) {
    const resultado = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] !== null && obj[key] !== undefined) {
            resultado[key] = obj[key];
        }
    });
    return resultado;
}

// Colección de invitados
const invitadosCollection = collection(db, 'invitados');

// Obtener todos los invitados
export async function obtenerInvitados() {
    try {
        const snapshot = await getDocs(invitadosCollection);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al obtener invitados:", error);
        throw error;
    }
}

// Obtener estadísticas
export async function obtenerEstadisticas() {
    try {
        const snapshot = await getDocs(invitadosCollection);
        const invitados = snapshot.docs.map(doc => doc.data());
        
        const stats = {
            invitadosBase: invitados.length, // Número base de invitados sin contar acompañantes
            totalInvitados: 0, // Total incluyendo acompañantes
            confirmados: 0, // Número de invitados principales que confirmaron
            totalConfirmados: 0, // Total de confirmados incluyendo acompañantes
            pendientes: 0,
            rechazados: 0,
            totalAcompanantes: 0
        };

        invitados.forEach(invitado => {
            const numAcompanantes = invitado.acompanantes || 0;
            
            switch (invitado.estado?.toLowerCase()) {
                case 'confirmado':
                    stats.confirmados++;
                    stats.totalAcompanantes += numAcompanantes;
                    // Para confirmados, sumamos el invitado principal + acompañantes
                    stats.totalConfirmados += 1 + numAcompanantes;
                    break;
                case 'rechazado':
                    stats.rechazados++;
                    break;
                default:
                    stats.pendientes++;
            }
        });

        // El total de invitados es la suma de:
        // 1. Confirmados (invitado principal + acompañantes)
        // 2. Pendientes (solo invitado principal por ahora)
        // 3. Rechazados (solo invitado principal)
        stats.totalInvitados = stats.totalConfirmados + stats.pendientes + stats.rechazados;

        return stats;
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        throw error;
    }
}

// Agregar nuevo invitado
export async function agregarInvitado(invitado) {
    try {
        // Preparar el objeto del invitado
        const invitadoData = {
            ...invitado,
            fechaCreacion: new Date(),
            estado: 'pendiente',
            // Solo incluir fechaConfirmacion si el estado es 'confirmado'
            ...(invitado.estado === 'confirmado' ? { fechaConfirmacion: new Date() } : {})
        };

        const docRef = await addDoc(invitadosCollection, invitadoData);
        return docRef.id;
    } catch (error) {
        console.error("Error al agregar invitado:", error);
        throw error;
    }
}

// Actualizar invitado
export async function actualizarInvitado(id, datos) {
    try {
        const invitadoRef = doc(db, 'invitados', id);
        
        // Preparar los datos básicos de actualización
        const updateData = {
            nombre: datos.nombre,
            codigo: datos.codigo,
            acompanantes: datos.acompanantes || 0,
            estado: datos.estado || 'pendiente',
            fechaActualizacion: new Date()
        };

        // Manejar el campo fechaConfirmacion
        if (datos.estado === 'confirmado') {
            updateData.fechaConfirmacion = new Date();
        } else {
            // Usar deleteField() para eliminar el campo completamente
            updateData.fechaConfirmacion = deleteField();
        }

        // Eliminar cualquier campo que sea undefined
        const datosLimpios = limpiarObjeto(updateData);

        await updateDoc(invitadoRef, datosLimpios);
    } catch (error) {
        console.error("Error al actualizar invitado:", error);
        throw error;
    }
}

// Eliminar invitado
export async function eliminarInvitado(id) {
    try {
        const invitadoRef = doc(db, 'invitados', id);
        await deleteDoc(invitadoRef);
    } catch (error) {
        console.error("Error al eliminar invitado:", error);
        throw error;
    }
}

// Buscar invitados
export async function buscarInvitados(termino) {
    try {
        const q = query(
            invitadosCollection,
            where('nombre', '>=', termino),
            where('nombre', '<=', termino + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error al buscar invitados:", error);
        throw error;
    }
}

// Obtener tendencia de confirmaciones
export async function obtenerTendenciaConfirmaciones() {
    try {
        const q = query(
            invitadosCollection,
            where('estado', '==', 'confirmado'),
            orderBy('fechaConfirmacion')
        );
        const snapshot = await getDocs(q);
        
        // Agrupar por semana
        const confirmacionesPorSemana = {};
        snapshot.docs.forEach(doc => {
            const datos = doc.data();
            if (datos.fechaConfirmacion) {
                const fecha = new Date(datos.fechaConfirmacion.toDate());
                const semana = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${Math.ceil(fecha.getDate() / 7)}`;
                confirmacionesPorSemana[semana] = (confirmacionesPorSemana[semana] || 0) + 1;
            }
        });

        return Object.entries(confirmacionesPorSemana).map(([semana, cantidad]) => ({
            semana,
            cantidad
        }));
    } catch (error) {
        console.error("Error al obtener tendencia:", error);
        throw error;
    }
}