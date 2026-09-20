// URL de la API. La levanta json-server cuando corres `npm run api`.
const API_URL = 'http://localhost:3000/tickets';

// Estado de la aplicación: la lista de tickets tal como la conoce el navegador.
// La pantalla siempre se dibuja a partir de este arreglo.
let tickets = [];

// Tu código empieza aquí.
let ticketEnEdicion = null; // null = creando, número = id del ticket en edición

// Mapeo de estados y prioridades con etiquetas y clases Tailwind
const ESTADOS = {
  abierto: { etiqueta: 'Abierto', clases: 'bg-sky-100 text-sky-800', siguiente: 'en_progreso' },
  en_progreso: { etiqueta: 'En progreso', clases: 'bg-amber-100 text-amber-800', siguiente: 'resuelto' },
  resuelto: { etiqueta: 'Resuelto', clases: 'bg-emerald-100 text-emerald-800', siguiente: null },
};

const PRIORIDADES = {
  baja: { etiqueta: 'Baja', clases: 'bg-green-100 text-green-800' },
  media: { etiqueta: 'Media', clases: 'bg-yellow-100 text-yellow-800' },
  alta: { etiqueta: 'Alta', clases: 'bg-red-100 text-red-800' },
};

// Función para dibujar los tickets
function renderTickets() {
  const lista = document.querySelector('#lista-tickets');
  const mensaje = document.querySelector('#mensaje');
  lista.innerHTML = '';

  // aplicar filtros
  let filtrados = tickets.filter(ticket => {
    const coincideEstado = filtroEstado === 'todos' || ticket.estado === filtroEstado;
    const coincideBusqueda = ticket.titulo.toLowerCase().includes(filtroBusqueda);
    return coincideEstado && coincideBusqueda;
  });

  if (filtrados.length === 0) {
    mensaje.textContent = 'No hay tickets que coincidan con el filtro.';
  } else {
    mensaje.textContent = '';
  }

  lista.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

  filtrados.forEach((ticket, index) => {
    const card = document.createElement('div');
    card.className = 'border rounded p-4 shadow';

    const titulo = document.createElement('h3');
    titulo.className = 'font-bold mb-2';
    titulo.textContent = `#${index + 1} - ${ticket.titulo}`;

    const descripcion = document.createElement('p');
    descripcion.textContent = ticket.descripcion;

    const solicitante = document.createElement('p');
    solicitante.textContent = `Solicitante: ${ticket.solicitante}`;

    const categoria = document.createElement('p');
    categoria.textContent = `Categoría: ${ticket.categoria}`;

    const prioridad = document.createElement('p');
    prioridad.textContent = `Prioridad: ${PRIORIDADES[ticket.prioridad].etiqueta}`;
    prioridad.className = PRIORIDADES[ticket.prioridad].clases + ' px-2 py-1 rounded block';

    const estado = document.createElement('p');
    estado.textContent = `Estado: ${ESTADOS[ticket.estado].etiqueta}`;
    estado.className = ESTADOS[ticket.estado].clases + ' px-2 py-1 rounded block';

    card.appendChild(titulo);
    card.appendChild(descripcion);
    card.appendChild(solicitante);
    card.appendChild(categoria);
    card.appendChild(prioridad);
    card.appendChild(estado);

    botonAvanzarEstado(ticket, card);
    botonEditar(ticket, card);
    botonEliminar(ticket, card);

    lista.appendChild(card);
  });

  actualizarResumen();
}

function actualizarResumen() {
  const resumen = document.getElementById('resumen');

  // contar por estado
  const conteoEstados = tickets.reduce((acc, t) => {
    acc[t.estado] = (acc[t.estado] || 0) + 1;
    return acc;
  }, {});

  // contar prioridad alta sin resolver
  const altaPendientes = tickets.filter(t => t.prioridad === 'alta' && t.estado !== 'resuelto').length;

  resumen.textContent = 
    `Abiertos: ${conteoEstados.abierto || 0}, ` +
    `En progreso: ${conteoEstados.en_progreso || 0}, ` +
    `Resueltos: ${conteoEstados.resuelto || 0}. ` +
    `Prioridad alta pendientes: ${altaPendientes}`;
}


function botonAvanzarEstado(ticket, card){
    // Botón según estado
    if (ticket.estado !== 'resuelto') {
        const boton = document.createElement('button');
        boton.className = 'mt-2 border rounded px-2 py-1 bg-purple-200 hover:bg-purple-400 transition mx-1';
        boton.textContent = ticket.estado === 'abierto' ? 'Empezar' : 'Marcar resuelto';

        // Listener que avanza el estado
        boton.addEventListener('click', async () => {
            const nuevoEstado = ESTADOS[ticket.estado].siguiente;
            try {
                const resp = await fetch(`${API_URL}/${ticket.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
                });

                if (!resp.ok) throw new Error(`Error ${resp.status}`);

                const actualizado = await resp.json();

                // actualizar arreglo
                const idx = tickets.findIndex(t => t.id === ticket.id);
                tickets[idx] = actualizado;

                renderTickets(); // volver a pintar
            } catch (error) {
                const mensaje = document.getElementById('mensaje');
                mensaje.textContent = `No se pudo actualizar el ticket (${error.message}).`;
            }
        });

        card.appendChild(boton);
    }
}

function botonEditar(ticket, card){
    const botonEditar = document.createElement('button');
    botonEditar.className = 'mt-2 border rounded px-2 py-1 bg-blue-200 hover:bg-blue-400 transition mx-1';
    botonEditar.textContent = 'Editar';

    botonEditar.addEventListener('click', () => {
        // Guardar id del ticket en edición
        ticketEnEdicion = ticket.id;
        

        // Llenar formulario con datos del ticket
        document.getElementById('titulo').value = ticket.titulo;
        document.getElementById('descripcion').value = ticket.descripcion;
        document.getElementById('solicitante').value = ticket.solicitante;
        document.getElementById('categoria').value = ticket.categoria;
        document.getElementById('prioridad').value = ticket.prioridad;

        // Cambiar UI del formulario
        document.getElementById('titulo-formulario').textContent = `Editar ticket #${ticket.id}`;
        document.getElementById('btn-guardar').textContent = 'Guardar cambios';
        document.getElementById('btn-cancelar').hidden = false;

        ticketEnEdicion = ticket; // guardas el objeto entero

    });

    card.appendChild(botonEditar);

}

function botonEliminar(ticket, card) {
  const botonEliminar = document.createElement('button');
  botonEliminar.className = 'mt-2 border rounded px-2 py-1 bg-red-200 hover:bg-red-400 transition mx-1';
  botonEliminar.textContent = 'Eliminar';

  botonEliminar.addEventListener('click', async () => {
    const confirmado = confirm(`¿Seguro que quieres eliminar el ticket #${ticket.id}?`);
    if (!confirmado) return;

    try {
      const resp = await fetch(`${API_URL}/${ticket.id}`, {
        method: 'DELETE'
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      // Quitar del arreglo
      tickets = tickets.filter(t => t.id !== ticket.id);

      // Si el ticket eliminado estaba en edición, volver al modo creación
      if (ticketEnEdicion && ticketEnEdicion.id === ticket.id) {
        resetFormulario();
      }

      renderTickets();
    } catch (error) {
      const mensaje = document.getElementById('mensaje');
      mensaje.textContent = `No se pudo eliminar el ticket (${error.message}).`;
    }
  });

  card.appendChild(botonEliminar);
}


// Función para cargar tickets desde la API
async function cargarTickets() {
  const mensaje = document.querySelector('#mensaje');
  mensaje.textContent = 'Cargando...';

  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) {
      throw new Error(`Error ${resp.status}: No se pudo obtener los tickets`);
    }
    tickets = await resp.json();

    if (tickets.length === 0) {
      mensaje.textContent = 'No hay tickets. ¡Crea el primero!';
    } else {
      renderTickets();
    }
  } catch (error) {
    mensaje.textContent = `Hubo un problema al cargar los tickets (${error.message}). 
    Verifica que el servidor esté corriendo y la URL sea correcta.`;
  }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarTickets);




// Validación del formulario
function validarFormulario() {
  let valido = true;

  const titulo = document.getElementById('titulo');
  const solicitante = document.getElementById('solicitante');
  const errorTitulo = document.getElementById('error-titulo');
  const errorSolicitante = document.getElementById('error-solicitante');

  // limpiar mensajes previos
  errorTitulo.textContent = '';
  errorSolicitante.textContent = '';

  // título: mínimo 5 caracteres sin espacios extremos
  if (titulo.value.trim().length < 5) {
    errorTitulo.textContent = 'El título debe tener al menos 5 caracteres.';
    valido = false;
  }

  // solicitante: no vacío
  if (solicitante.value.trim() === '') {
    errorSolicitante.textContent = 'El solicitante no puede estar vacío.';
    valido = false;
  }

  return valido;
}

// Manejo del submit
document.getElementById('form-ticket').addEventListener('submit', async (e) => {
  e.preventDefault(); // evitar validación automática del navegador

  if (!validarFormulario()) return;

  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const solicitante = document.getElementById('solicitante').value.trim();
  const categoria = document.getElementById('categoria').value;
  const prioridad = document.getElementById('prioridad').value;

  let estadoV = ticketEnEdicion===null ? 'abierto' : `${ticketEnEdicion.estado}`
  // objeto nuevo ticket
  const nuevoTicket = {
    titulo,
    descripcion,
    solicitante,
    categoria,
    prioridad,
    
    estado: estadoV//'abierto' // siempre arranca abierto
  };

  try {
    let resp;
    if (ticketEnEdicion === null) {
      // Crear nuevo (POST)
      resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTicket)
      });
    } else {
      // Editar existente (PUT)
      resp = await fetch(`${API_URL}/${ticketEnEdicion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTicket)
      });
    }
    //const resp = await fetch(API_URL, {
    //  method: 'POST',
    //  headers: { 'Content-Type': 'application/json' },
    //  body: JSON.stringify(nuevoTicket)
    //});

    if (!resp.ok) {
      throw new Error(`Error ${resp.status}: no se pudo crear el ticket`);
    }

    const ticketCreado = await resp.json();

    // agregar al arreglo y redibujar
    //tickets.push(ticketCreado);
    if (ticketEnEdicion === null) {
      tickets.push(ticketCreado);
    } else {
      const idx = tickets.findIndex(t => t.id === ticketEnEdicion.id);
      tickets[idx] = ticketCreado;
    }

    renderTickets();

    // limpiar formulario
    //e.target.reset();
    resetFormulario();
  } catch (error) {
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = `Hubo un problema al crear el ticket (${error.message}).`;
  }
});


document.getElementById('btn-cancelar').addEventListener('click', () => {
  resetFormulario();
});

function resetFormulario() {
  document.getElementById('form-ticket').reset();
  document.getElementById('titulo-formulario').textContent = 'Nuevo ticket';
  document.getElementById('btn-guardar').textContent = 'Crear ticket';
  document.getElementById('btn-cancelar').hidden = true;
  ticketEnEdicion = null;
}



// Variables para filtros
let filtroEstado = 'todos';
let filtroBusqueda = '';

document.getElementById('filtro-estado').addEventListener('change', (e) => {
  filtroEstado = e.target.value;
  renderTickets();
});

document.getElementById('busqueda').addEventListener('input', (e) => {
  filtroBusqueda = e.target.value.toLowerCase();
  renderTickets();
});
