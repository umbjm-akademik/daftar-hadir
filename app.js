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
   * Bersihkan tanda tangan sebelumnya
   */
  hasSignature = false;
  
  
  /*
   * Canvas baru diinisialisasi SETELAH
   * personSection terlihat.
   */
  requestAnimationFrame(() => {
  
    setupSignature();
  
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
    console.error(
      'Canvas tidak ditemukan.'
    );
    return;
  }


  ctx = canvas.getContext('2d');


  /*
   * Ambil ukuran kotak yang SUDAH TERLIHAT
   */
  const rect =
    canvas.getBoundingClientRect();


  const width =
    Math.round(rect.width);

  const height =
    Math.round(rect.height);


  console.log(
    'Canvas size:',
    width,
    height
  );


  if (
    width <= 0 ||
    height <= 0
  ) {

    console.error(
      'Canvas memiliki ukuran 0.'
    );

    return;

  }


  /*
   * Device pixel ratio
   */
  const ratio =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  /*
   * Ukuran internal canvas
   */
  canvas.width =
    width * ratio;

  canvas.height =
    height * ratio;


  /*
   * Ukuran visual
   */
  canvas.style.width =
    width + 'px';

  canvas.style.height =
    height + 'px';


  /*
   * Reset transform
   */
  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );


  /*
   * Tampilan garis
   */
  ctx.strokeStyle =
    '#0057B8';

  ctx.lineWidth =
    2.5;

  ctx.lineCap =
    'round';

  ctx.lineJoin =
    'round';


  /*
   * Pastikan browser tidak
   * mengambil alih gesture.
   */
  canvas.style.touchAction =
    'none';


  /*
   * Pointer Events
   */
  canvas.addEventListener(
    'pointerdown',
    signaturePointerDown
  );

  canvas.addEventListener(
    'pointermove',
    signaturePointerMove
  );

  canvas.addEventListener(
    'pointerup',
    signaturePointerUp
  );

  canvas.addEventListener(
    'pointercancel',
    signaturePointerUp
  );


  /*
   * Untuk browser lama / fallback touch
   */
  canvas.addEventListener(
    'touchstart',
    signatureTouchStart,
    {
      passive: false
    }
  );

  canvas.addEventListener(
    'touchmove',
    signatureTouchMove,
    {
      passive: false
    }
  );

  canvas.addEventListener(
    'touchend',
    signatureTouchEnd,
    {
      passive: false
    }
  );


  console.log(
    'Canvas tanda tangan siap.'
  );

}


/* =========================================
   POINTER DOWN
========================================= */

function signaturePointerDown(
  event
) {

  event.preventDefault();


  const rect =
    canvas.getBoundingClientRect();


  const x =
    event.clientX -
    rect.left;

  const y =
    event.clientY -
    rect.top;


  isDrawing = true;

  hasSignature = true;


  ctx.beginPath();

  ctx.moveTo(
    x,
    y
  );


  if (
    canvas.setPointerCapture
  ) {

    canvas.setPointerCapture(
      event.pointerId
    );

  }

}


/* =========================================
   POINTER MOVE
========================================= */

function signaturePointerMove(
  event
) {

  if (!isDrawing) {
    return;
  }


  event.preventDefault();


  const rect =
    canvas.getBoundingClientRect();


  const x =
    event.clientX -
    rect.left;

  const y =
    event.clientY -
    rect.top;


  ctx.lineTo(
    x,
    y
  );

  ctx.stroke();

}


/* =========================================
   POINTER UP
========================================= */

function signaturePointerUp(
  event
) {

  event.preventDefault();


  if (!isDrawing) {
    return;
  }


  isDrawing = false;


  ctx.closePath();


  if (
    canvas.releasePointerCapture
  ) {

    try {

      canvas.releasePointerCapture(
        event.pointerId
      );

    } catch (e) {}

  }

}


/* =========================================
   TOUCH START
========================================= */

function signatureTouchStart(
  event
) {

  event.preventDefault();


  if (
    !event.touches ||
    event.touches.length === 0
  ) {
    return;
  }


  const touch =
    event.touches[0];


  const rect =
    canvas.getBoundingClientRect();


  const x =
    touch.clientX -
    rect.left;

  const y =
    touch.clientY -
    rect.top;


  isDrawing = true;

  hasSignature = true;


  ctx.beginPath();

  ctx.moveTo(
    x,
    y
  );

}


/* =========================================
   TOUCH MOVE
========================================= */

function signatureTouchMove(
  event
) {

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


  const rect =
    canvas.getBoundingClientRect();


  const x =
    touch.clientX -
    rect.left;

  const y =
    touch.clientY -
    rect.top;


  ctx.lineTo(
    x,
    y
  );

  ctx.stroke();

}


/* =========================================
   TOUCH END
========================================= */

function signatureTouchEnd(
  event
) {

  event.preventDefault();


  isDrawing = false;

  ctx.closePath();

}


/* =========================================
   BERSIHKAN
========================================= */

function clearSignature() {

  if (
    !canvas ||
    !ctx
  ) {
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


  hasSignature = false;

}

/* =========================================
   KIRIM PRESENSI
========================================= */

async function submitAttendance() {

  const button =
    document.getElementById(
      'submitButton'
    );

  hideError('submitError');


  /*
   * Validasi kegiatan
   */
  if (!selectedActivity) {

    showSubmitError(
      'Kegiatan belum dipilih.'
    );

    return;

  }


  /*
   * Validasi peserta
   */
  if (!currentPerson) {

    showSubmitError(
      'Data peserta belum ditemukan.'
    );

    return;

  }


  /*
   * Validasi tanda tangan
   */
  if (!hasSignature) {

    showSubmitError(
      'Silakan tanda tangan terlebih dahulu.'
    );

    return;

  }


  /*
   * Ubah tombol
   */
  button.disabled = true;

  button.textContent =
    'Mengirim...';


  try {

    console.log(
      '1. Menyiapkan tanda tangan...'
    );


    /*
     * Ubah canvas menjadi JPEG.
     */
    const signature =
      canvas.toDataURL(
        'image/jpeg',
        0.65
      );


    console.log(
      '2. Ukuran data tanda tangan:',
      signature.length
    );


    /*
     * Kirim ke Apps Script.
     */
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


    console.log(
      '3. HTTP Status:',
      response.status
    );


    /*
     * Ambil response sebagai text
     * agar error lebih mudah dibaca.
     */
    const text =
      await response.text();


    console.log(
      '4. Response Apps Script:',
      text
    );


    let data;

    try {

      data =
        JSON.parse(text);

    }

    catch (error) {

      throw new Error(
        'Response dari server tidak valid.'
      );

    }


    /*
     * BERHASIL
     */
    if (data.success) {

      console.log(
        '5. Presensi berhasil:',
        data
      );


      showSuccess(
        data
      );

      return;

    }


    /*
     * DUPLIKAT
     */
    if (data.duplicate) {

      showSubmitError(
        'Anda sudah melakukan presensi pada kegiatan ini.'
      );

      return;

    }


    /*
     * ERROR DARI SERVER
     */
    showSubmitError(
      data.message ||
      'Presensi gagal dikirim.'
    );

  }

  catch (error) {

    console.error(
      'SUBMIT ERROR:',
      error
    );


    showSubmitError(
      error.message ||
      'Terjadi kesalahan saat mengirim presensi.'
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

function showSuccess(data) {

  /*
   * Sembunyikan form tanda tangan.
   */
  document
    .getElementById(
      'personSection'
    )
    .classList
    .add('hidden');


  /*
   * Tampilkan halaman sukses.
   */
  const successSection =
    document.getElementById(
      'successSection'
    );

  successSection
    .classList
    .remove('hidden');


  /*
   * Tampilkan informasi presensi.
   */
  const successInfo =
    document.getElementById(
      'successInfo'
    );


  successInfo.innerHTML = `

    <strong>
      ${escapeHtml(
        data.nama || currentPerson.nama
      )}
    </strong>

    <br>

    ${escapeHtml(
      data.activity ||
      selectedActivity.name
    )}

    <br>

    ${escapeHtml(
      data.timestamp || ''
    )}
    ${data.timestamp ? ' WITA' : ''}

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
