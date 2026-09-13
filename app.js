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

  requestAnimationFrame(() => {
  
    resizeCanvas();
  
    /*
     * Resize sekali lagi setelah browser
     * benar-benar menyelesaikan layout.
     */
    setTimeout(() => {
  
      resizeCanvas();
  
    }, 100);
  
  });

}

/* =========================================
   CANVAS TANDA TANGAN
========================================= */

function setupSignature() {

  canvas = document.getElementById(
    'signatureCanvas'
  );

  if (!canvas) {
    console.error('Canvas tanda tangan tidak ditemukan.');
    return;
  }

  ctx = canvas.getContext('2d');

  /*
   * Konfigurasi tampilan garis
   */
  setupCanvasStyle();

  /*
   * Ukuran awal.
   * Jika masih hidden, fungsi akan dilewati.
   */
  resizeCanvas();

  /*
   * Resize ketika ukuran layar berubah
   */
  window.addEventListener(
    'resize',
    resizeCanvas
  );


  /*
   * ==========================
   * POINTER EVENTS
   * ==========================
   */

  canvas.addEventListener(
    'pointerdown',
    startDrawing,
    { passive: false }
  );

  canvas.addEventListener(
    'pointermove',
    draw,
    { passive: false }
  );

  canvas.addEventListener(
    'pointerup',
    stopDrawing,
    { passive: false }
  );

  canvas.addEventListener(
    'pointercancel',
    stopDrawing,
    { passive: false }
  );


  /*
   * ==========================
   * TOUCH FALLBACK
   * ==========================
   *
   * Untuk browser yang tidak
   * menangani Pointer Events
   * dengan baik.
   */

  canvas.addEventListener(
    'touchstart',
    handleTouchStart,
    { passive: false }
  );

  canvas.addEventListener(
    'touchmove',
    handleTouchMove,
    { passive: false }
  );

  canvas.addEventListener(
    'touchend',
    handleTouchEnd,
    { passive: false }
  );

}


/* =========================================
   STYLE CANVAS
========================================= */

function setupCanvasStyle() {

  if (!ctx) {
    return;
  }

  ctx.lineWidth = 2.5;

  ctx.lineCap = 'round';

  ctx.lineJoin = 'round';

  ctx.strokeStyle = '#17181a';

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
   * Canvas belum terlihat.
   */
  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return;
  }


  /*
   * Simpan gambar lama
   * apabila ada tanda tangan.
   */
  let oldImage = null;

  if (
    hasSignature &&
    canvas.width > 0 &&
    canvas.height > 0
  ) {

    oldImage =
      canvas.toDataURL('image/png');

  }


  /*
   * Device Pixel Ratio
   *
   * Maksimal 2 agar ukuran file
   * tidak terlalu besar.
   */
  const ratio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  /*
   * Ukuran asli canvas
   */
  canvas.width =
    Math.round(
      rect.width * ratio
    );

  canvas.height =
    Math.round(
      rect.height * ratio
    );


  /*
   * Ukuran tampilan canvas
   */
  canvas.style.width =
    rect.width + 'px';

  canvas.style.height =
    rect.height + 'px';


  /*
   * Ambil context lagi
   * karena canvas baru saja di-resize.
   */
  ctx =
    canvas.getContext('2d');


  /*
   * Gunakan koordinat CSS pixel.
   */
  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );


  setupCanvasStyle();


  /*
   * Kembalikan tanda tangan lama
   */
  if (oldImage) {

    const image =
      new Image();

    image.onload = function () {

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

function getPointerPosition(event) {

  const rect =
    canvas.getBoundingClientRect();

  return {
    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top
  };

}


/* =========================================
   POINTER DOWN
========================================= */

function startDrawing(event) {

  event.preventDefault();

  /*
   * Ambil pointer secara eksklusif
   * selama jari berada di canvas.
   */
  if (
    canvas.setPointerCapture
  ) {

    try {

      canvas.setPointerCapture(
        event.pointerId
      );

    } catch (error) {

      console.log(
        'Pointer capture tidak tersedia.'
      );

    }

  }


  const position =
    getPointerPosition(event);


  isDrawing = true;

  hasSignature = true;


  ctx.beginPath();

  ctx.moveTo(
    position.x,
    position.y
  );

}


/* =========================================
   POINTER MOVE
========================================= */

function draw(event) {

  if (!isDrawing) {
    return;
  }

  event.preventDefault();


  const position =
    getPointerPosition(event);


  ctx.lineTo(
    position.x,
    position.y
  );

  ctx.stroke();

}


/* =========================================
   POINTER UP
========================================= */

function stopDrawing(event) {

  if (!isDrawing) {
    return;
  }


  if (
    event &&
    event.preventDefault
  ) {

    event.preventDefault();

  }


  isDrawing = false;

  ctx.closePath();


  /*
   * Lepaskan pointer capture
   */
  if (
    canvas.releasePointerCapture &&
    event &&
    event.pointerId !== undefined
  ) {

    try {

      canvas.releasePointerCapture(
        event.pointerId
      );

    } catch (error) {

      // Abaikan

    }

  }

}


/* =========================================
   TOUCH FALLBACK
========================================= */

function handleTouchStart(event) {

  event.preventDefault();

  if (
    !event.touches ||
    event.touches.length === 0
  ) {
    return;
  }


  const touch =
    event.touches[0];


  const fakeEvent = {

    clientX: touch.clientX,

    clientY: touch.clientY,

    preventDefault: () => {}

  };


  startDrawing(fakeEvent);

}


function handleTouchMove(event) {

  event.preventDefault();

  if (
    !isDrawing ||
    !event.touches ||
    event.touches.length === 0
  ) {
    return;
  }


  const touch =
    event.touches[0];


  const fakeEvent = {

    clientX: touch.clientX,

    clientY: touch.clientY,

    preventDefault: () => {}

  };


  draw(fakeEvent);

}


function handleTouchEnd(event) {

  event.preventDefault();

  stopDrawing(event);

}


/* =========================================
   BERSIHKAN TANDA TANGAN
========================================= */

function clearSignature() {

  if (!canvas) {
    return;
  }


  const rect =
    canvas.getBoundingClientRect();


  if (
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return;
  }


  /*
   * Karena context menggunakan
   * transform ratio, clearRect
   * menggunakan ukuran CSS.
   */
  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );


  hasSignature = false;

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
