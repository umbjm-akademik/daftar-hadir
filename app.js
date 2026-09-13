const API_URL =
  'https://script.google.com/macros/s/AKfycbyNOS_an60Wt_Ozyfb0mGHlH3kJj9cjPYEdPZTIuLZguXFtxRURdDi_FllR3yNTsPR5/exec';


let selectedActivity = null;
let currentPerson = null;

let canvas = null;
let ctx = null;

let isDrawing = false;
let hasSignature = false;


/* =========================================
   START
========================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    loadActivities();

    setupEvents();

    setupSignature();

  }
);


/* =========================================
   EVENT
========================================= */

function setupEvents() {

  const continueButton =
    document.getElementById(
      'continueButton'
    );

  continueButton.addEventListener(
    'click',
    findPerson
  );


  const identityInput =
    document.getElementById(
      'identityInput'
    );

  identityInput.addEventListener(
    'keydown',
    event => {

      if (event.key === 'Enter') {

        findPerson();

      }

    }
  );


  const clearButton =
    document.getElementById(
      'clearSignature'
    );

  clearButton.addEventListener(
    'click',
    clearSignature
  );


  const submitButton =
    document.getElementById(
      'submitButton'
    );

  submitButton.addEventListener(
    'click',
    submitAttendance
  );

}


/* =========================================
   LOAD KEGIATAN
========================================= */

async function loadActivities() {

  const loading =
    document.getElementById(
      'loading'
    );

  const noActivity =
    document.getElementById(
      'noActivity'
    );


  try {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        15000
      );


    const response =
      await fetch(
        API_URL,
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body: JSON.stringify({
            action:
              'getActiveActivities'
          }),

          signal:
            controller.signal

        }
      );


    clearTimeout(timeout);


    if (!response.ok) {

      throw new Error(
        'HTTP ' +
        response.status
      );

    }


    const data =
      await response.json();


    console.log(
      'Active activities:',
      data
    );


    loading.classList.add(
      'hidden'
    );


    if (
      !data.success ||
      !Array.isArray(
        data.activities
      ) ||
      data.activities.length === 0
    ) {

      noActivity.classList.remove(
        'hidden'
      );

      return;

    }


    /*
     * Satu kegiatan:
     * langsung masuk.
     */

    if (
      data.activities.length === 1
    ) {

      selectActivity(
        data.activities[0]
      );

      return;

    }


    /*
     * Banyak kegiatan:
     * tampilkan pilihan.
     */

    showActivities(
      data.activities
    );


  }

  catch (error) {

    console.error(
      error
    );


    loading.classList.add(
      'hidden'
    );


    noActivity
      .classList
      .remove('hidden');


    noActivity
      .querySelector('h2')
      .textContent =
        'Tidak Dapat Memuat Data';


    noActivity
      .querySelector('p')
      .textContent =
        'Periksa koneksi internet lalu coba lagi.';

  }

}


/* =========================================
   TAMPILKAN KEGIATAN
========================================= */

function showActivities(
  activities
) {

  const selection =
    document.getElementById(
      'activitySelection'
    );

  const list =
    document.getElementById(
      'activityList'
    );


  list.innerHTML = '';


  activities.forEach(
    activity => {

      const button =
        document.createElement(
          'button'
        );


      button.type =
        'button';

      button.className =
        'activity-card';


      button.innerHTML = `

        <div class="activity-card-name">
          ${escapeHtml(
            activity.name
          )}
        </div>

        <div class="activity-card-time">
          ${escapeHtml(
            activity.start
          )}
          –
          ${escapeHtml(
            activity.end
          )}
          WITA
        </div>

      `;


      button.onclick =
        () => selectActivity(
          activity
        );


      list.appendChild(
        button
      );

    }
  );


  selection
    .classList
    .remove('hidden');

}


/* =========================================
   PILIH KEGIATAN
========================================= */

function selectActivity(
  activity
) {

  selectedActivity =
    activity;


  document
    .getElementById(
      'activitySelection'
    )
    .classList
    .add('hidden');


  document
    .getElementById(
      'identitySection'
    )
    .classList
    .remove('hidden');


  document
    .getElementById(
      'activityName'
    )
    .textContent =
      activity.name;


  document
    .getElementById(
      'activityTime'
    )
    .textContent =
      `Presensi dibuka ${activity.start}–${activity.end} WITA`;


  const identityInput =
    document.getElementById(
      'identityInput'
    );


  identityInput.value = '';


  setTimeout(
    () => {

      identityInput.focus();

    },
    150
  );

}


/* =========================================
   CARI IDENTITAS
========================================= */

async function findPerson() {

  const input =
    document.getElementById(
      'identityInput'
    );

  const button =
    document.getElementById(
      'continueButton'
    );


  const identitas =
    input.value.trim();


  hideError(
    'identityError'
  );


  if (!identitas) {

    showIdentityError(
      'Silakan masukkan nomor identitas.'
    );

    input.focus();

    return;

  }


  if (!/^\d+$/.test(
    identitas
  )) {

    showIdentityError(
      'Nomor identitas hanya boleh berisi angka.'
    );

    input.focus();

    return;

  }


  button.disabled =
    true;

  button.textContent =
    'Mencari...';


  try {

    const response =
      await fetch(
        API_URL,
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body: JSON.stringify({

            action:
              'getPerson',

            identitas:
              identitas

          })

        }
      );


    const data =
      await response.json();


    console.log(
      'Person:',
      data
    );


    if (
      data.success &&
      data.person
    ) {

      currentPerson =
        data.person;


      showPerson(
        data.person
      );


    }

    else {

      showIdentityError(
        data.message ||
        'Data tidak ditemukan.'
      );

    }


  }

  catch (error) {

    console.error(
      error
    );


    showIdentityError(
      'Terjadi kesalahan koneksi. Silakan coba lagi.'
    );

  }


  finally {

    button.disabled =
      false;

    button.textContent =
      'Lanjut';

  }

}


/* =========================================
   TAMPILKAN DATA PESERTA
========================================= */

function showPerson(
  person
) {

  document
    .getElementById(
      'identitySection'
    )
    .classList
    .add('hidden');


  document
    .getElementById(
      'personSection'
    )
    .classList
    .remove('hidden');


  document
    .getElementById(
      'personName'
    )
    .textContent =
      person.nama;


  const details =
    document.getElementById(
      'personDetails'
    );


  let html = '';


  if (
    person.jenis ===
    'Mahasiswa'
  ) {

    html =
      escapeHtml(
        person.programStudi ||
        ''
      );

  }


  else if (
    person.jenis ===
    'Dosen'
  ) {

    html = `
      ${escapeHtml(
        person.programStudi ||
        ''
      )}

      ${
        person.jabatan
          ? '<br>' +
            escapeHtml(
              person.jabatan
            )
          : ''
      }
    `;

  }


  else if (
    person.jenis ===
    'Tendik'
  ) {

    html = `
      ${escapeHtml(
        person.bagian ||
        ''
      )}

      ${
        person.jabatan
          ? '<br>' +
            escapeHtml(
              person.jabatan
            )
          : ''
      }
    `;

  }


  else {

    html =
      escapeHtml(
        person.jenis ||
        ''
      );

  }


  details.innerHTML =
    html;


  /*
   * Bersihkan tanda tangan
   * setiap kali peserta baru ditemukan.
   */

  clearSignature();

}


/* =========================================
   CANVAS TANDA TANGAN
========================================= */

function setupSignature() {

  canvas =
    document.getElementById(
      'signatureCanvas'
    );


  if (!canvas) {
    return;
  }


  ctx =
    canvas.getContext(
      '2d'
    );


  resizeCanvas();


  window.addEventListener(
    'resize',
    () => {

      resizeCanvas();

    }
  );


  /*
   * Mouse
   */

  canvas.addEventListener(
    'mousedown',
    startDrawing
  );

  canvas.addEventListener(
    'mousemove',
    draw
  );

  canvas.addEventListener(
    'mouseup',
    stopDrawing
  );

  canvas.addEventListener(
    'mouseleave',
    stopDrawing
  );


  /*
   * Touch
   */

  canvas.addEventListener(
    'touchstart',
    startDrawing,
    {
      passive: false
    }
  );

  canvas.addEventListener(
    'touchmove',
    draw,
    {
      passive: false
    }
  );

  canvas.addEventListener(
    'touchend',
    stopDrawing,
    {
      passive: false
    }
  );

}


/* =========================================
   RESIZE CANVAS
========================================= */

function resizeCanvas() {

  if (!canvas) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  /*
   * Simpan tanda tangan lama
   * jika ada.
   */

  let oldImage = null;

  if (
    hasSignature &&
    canvas.width > 0 &&
    canvas.height > 0
  ) {

    oldImage =
      canvas.toDataURL(
        'image/png'
      );

  }


  const ratio =
    Math.min(
      window.devicePixelRatio ||
      1,
      2
    );


  canvas.width =
    Math.round(
      rect.width * ratio
    );


  canvas.height =
    Math.round(
      rect.height * ratio
    );


  ctx =
    canvas.getContext(
      '2d'
    );


  ctx.scale(
    ratio,
    ratio
  );


  ctx.lineWidth =
    2.2;

  ctx.lineCap =
    'round';

  ctx.lineJoin =
    'round';

  ctx.strokeStyle =
    '#17181a';


  if (oldImage) {

    const image =
      new Image();

    image.onload =
      () => {

        ctx.drawImage(
          image,
          0,
          0,
          rect.width,
          rect.height
        );

      };

    image.src =
      oldImage;

  }

}


/* =========================================
   POSISI POINTER
========================================= */

function getPointerPosition(
  event
) {

  const rect =
    canvas.getBoundingClientRect();


  let clientX;
  let clientY;


  if (
    event.touches &&
    event.touches.length > 0
  ) {

    clientX =
      event.touches[0].clientX;

    clientY =
      event.touches[0].clientY;

  }

  else {

    clientX =
      event.clientX;

    clientY =
      event.clientY;

  }


  return {

    x:
      clientX -
      rect.left,

    y:
      clientY -
      rect.top

  };

}


/* =========================================
   MULAI MENGGAMBAR
========================================= */

function startDrawing(
  event
) {

  event.preventDefault();


  const position =
    getPointerPosition(
      event
    );


  isDrawing =
    true;

  hasSignature =
    true;


  ctx.beginPath();

  ctx.moveTo(
    position.x,
    position.y
  );

}


/* =========================================
   MENGGAMBAR
========================================= */

function draw(
  event
) {

  if (!isDrawing) {
    return;
  }


  event.preventDefault();


  const position =
    getPointerPosition(
      event
    );


  ctx.lineTo(
    position.x,
    position.y
  );


  ctx.stroke();

}


/* =========================================
   SELESAI MENGGAMBAR
========================================= */

function stopDrawing(
  event
) {

  if (!isDrawing) {
    return;
  }


  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  isDrawing =
    false;


  ctx.closePath();

}


/* =========================================
   BERSIHKAN TANDA TANGAN
========================================= */

function clearSignature() {

  if (!canvas || !ctx) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );


  hasSignature =
    false;

}


/* =========================================
   KIRIM PRESENSI
========================================= */

async function submitAttendance() {

  const button =
    document.getElementById(
      'submitButton'
    );


  hideError(
    'submitError'
  );


  if (!selectedActivity) {

    showSubmitError(
      'Kegiatan belum dipilih.'
    );

    return;

  }


  if (!currentPerson) {

    showSubmitError(
      'Data peserta belum ditemukan.'
    );

    return;

  }


  if (!hasSignature) {

    showSubmitError(
      'Silakan tanda tangan terlebih dahulu.'
    );

    return;

  }


  button.disabled =
    true;

  button.textContent =
    'Mengirim...';


  try {

    /*
     * Kompres tanda tangan.
     */

    const signature =
      canvas.toDataURL(
        'image/jpeg',
        0.65
      );


    const response =
      await fetch(
        API_URL,
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body: JSON.stringify({

            action:
              'submitAttendance',

            activityId:
              selectedActivity.id,

            identitas:
              currentPerson.identitas,

            signature:
              signature

          })

        }
      );


    const data =
      await response.json();


    console.log(
      'Submit:',
      data
    );


    if (data.success) {

      showSuccess(
        data
      );

      return;

    }


    if (
      data.duplicate
    ) {

      showSubmitError(
        'Anda sudah melakukan presensi pada kegiatan ini.'
      );

    }

    else {

      showSubmitError(
        data.message ||
        'Presensi gagal dikirim.'
      );

    }


  }

  catch (error) {

    console.error(
      error
    );


    showSubmitError(
      'Terjadi kesalahan koneksi. Silakan coba lagi.'
    );

  }


  finally {

    button.disabled =
      false;

    button.textContent =
      'Kirim Kehadiran';

  }

}


/* =========================================
   BERHASIL
========================================= */

function showSuccess(
  data
) {

  document
    .getElementById(
      'personSection'
    )
    .classList
    .add('hidden');


  document
    .getElementById(
      'successSection'
    )
    .classList
    .remove('hidden');


  document
    .getElementById(
      'successInfo'
    )
    .innerHTML = `

      <strong>
        ${escapeHtml(
          data.nama
        )}
      </strong>

      <br>

      ${escapeHtml(
        data.activity
      )}

      <br>

      ${escapeHtml(
        data.timestamp
      )}
      WITA

    `;

}


/* =========================================
   ERROR
========================================= */

function showIdentityError(
  message
) {

  const error =
    document.getElementById(
      'identityError'
    );


  error.textContent =
    message;


  error.classList
    .remove('hidden');

}


function showSubmitError(
  message
) {

  const error =
    document.getElementById(
      'submitError'
    );


  error.textContent =
    message;


  error.classList
    .remove('hidden');

}


function hideError(
  id
) {

  document
    .getElementById(id)
    .classList
    .add('hidden');

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(
  text
) {

  const div =
    document.createElement(
      'div'
    );


  div.textContent =
    text ?? '';


  return div.innerHTML;

}
