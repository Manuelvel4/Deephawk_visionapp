// socketController.js
import socketIo from 'socket.io';

// Función para inicializar y manejar las conexiones de WebSocket
export function initializeSocket(server) {
    const io = socketIo(server);

    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado');

        // Escuchar el evento 'start-training' y ejecutar la lógica
        socket.on('start-training', (data) => {
            console.log('Iniciando entrenamiento');
            // Puedes importar aquí tu función de entrenamiento
        });

        // Agregar otros eventos o lógica de WebSocket aquí si es necesario
    });

    return io;
}
