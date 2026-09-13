const API_URL = 'https://script.google.com/macros/s/AKfycbyNOS_an60Wt_Ozyfb0mGHlH3kJj9cjPYEdPZTIuLZguXFtxRURdDi_FllR3yNTsPR5/exec';

let selectedActivity = null;
let currentPerson = null;


document.addEventListener('DOMContentLoaded', () => {

  loadActivities();

  const continueButton =
    document.getElementById('continueButton');

  continueButton.addEventListener(
    'click',
    findPerson
  );


  const identityInput =
    document.getElementById('identityInput');

  identityInput.addEventListener(
    'keydown',
    event => {

      if (event.key === 'Enter') {
        findPerson();
      }

    }
  );

});


/**
 * ============================
 * KEGIATAN
 * ============================
 */

async function loadActivities() {

  const loading =
    document.getElementById('loading');

  const noActivity =
    document.getElementById('noActivity');

  try {

    /*
     * Batasi waktu tunggu API.
     * Jika lebih dari 15 detik, dianggap gagal.
     */
    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, 15000);


    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body: JSON.stringify({
          action: 'getActiveActivities'
        }),

        signal: controller.signal

      });


    clearTimeout(timeout);


    if (!response.ok) {

      throw new Error(
        'Server mengembalikan error HTTP ' +
        response.status
      );

    }


    const data =
      await response.json();


    console.log(
      'Active activities:',
      data
    );


    /*
     * Pastikan response valid.
     */
    if (!data.success) {

      throw new Error(
        data.message ||
        'Gagal mengambil data kegiatan'
      );

    }


    /*
     * Hilangkan loading
     */
    loading.classList.add(
      'hidden'
    );


    /*
     * Tidak ada kegiatan
     */
    if (
      !Array.isArray(data.activities) ||
      data.activities.length === 0
    ) {

      noActivity
        .classList
        .remove('hidden');

      return;

    }


    /*
     * SATU kegiatan aktif
     *
     * Langsung masuk ke form identitas.
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
     * LEBIH DARI SATU kegiatan
     *
     * Tampilkan pilihan.
     */
    showActivities(
      data.activities
    );


  }

  catch (error) {

    console.error(
      'LOAD ACTIVITY ERROR:',
      error
    );


    /*
     * Pastikan spinner selalu hilang.
     */
    loading.classList.add(
      'hidden'
    );


    /*
     * Tampilkan pesan error
     */
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
        'Periksa koneksi internet lalu coba buka kembali.';

  }

}


/**
 * Menampilkan daftar kegiatan.
 */
function showActivities(activities) {

  const selection =
    document.getElementById('activitySelection');

  const list =
    document.getElementById('activityList');

  list.innerHTML = '';

  activities.forEach(activity => {

    const button =
      document.createElement('button');

    button.type = 'button';

    button.className = 'activity-card';

    button.innerHTML = `
      <div class="activity-card-name">
        ${escapeHtml(activity.name)}
      </div>

      <div class="activity-card-time">
        ${escapeHtml(activity.start)}
        –
        ${escapeHtml(activity.end)}
        WITA
      </div>
    `;

    /*
     * Klik kegiatan
     */
    button.onclick = function () {

      selectActivity(activity);

    };

    list.appendChild(button);

  });

  selection.classList.remove('hidden');

}


function selectActivity(activity) {

  console.log(
    'KEGIATAN DIPILIH:',
    activity
  );

  selectedActivity = activity;

  /*
   * Sembunyikan pilihan kegiatan
   */
  document
    .getElementById('activitySelection')
    .classList.add('hidden');


  /*
   * Tampilkan form identitas
   */
  document
    .getElementById('identitySection')
    .classList.remove('hidden');


  /*
   * Isi nama kegiatan
   */
  document
    .getElementById('activityName')
    .textContent =
      activity.name;


  /*
   * Isi waktu kegiatan
   */
  document
    .getElementById('activityTime')
    .textContent =
      `Presensi dibuka ${activity.start}–${activity.end} WITA`;


  /*
   * Kosongkan input identitas
   */
  const identityInput =
    document.getElementById('identityInput');

  identityInput.value = '';


  /*
   * Fokus ke input
   */
  setTimeout(() => {

    identityInput.focus();

  }, 150);

}


/**
 * ============================
 * IDENTITAS
 * ============================
 */

async function findPerson() {

  const input =
    document.getElementById(
      'identityInput'
    );

  const button =
    document.getElementById(
      'continueButton'
    );

  const error =
    document.getElementById(
      'identityError'
    );


  const identitas =
    input.value.trim();


  error.classList.add(
    'hidden'
  );


  if (!identitas) {

    showIdentityError(
      'Silakan masukkan nomor identitas.'
    );

    input.focus();

    return;
  }


  /**
   * Hanya angka.
   */
  if (!/^\d+$/.test(identitas)) {

    showIdentityError(
      'Nomor identitas hanya boleh berisi angka.'
    );

    input.focus();

    return;
  }


  button.disabled = true;

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

            action: 'getPerson',

            identitas: identitas

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

    console.error(error);

    showIdentityError(
      'Terjadi kesalahan koneksi. Silakan coba lagi.'
    );

  }


  finally {

    button.disabled = false;

    button.textContent =
      'Lanjut';

  }

}


/**
 * Menampilkan data peserta.
 */
function showPerson(
  person
) {

  document
    .getElementById(
      'identitySection'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'personSection'
    )
    .classList.remove(
      'hidden'
    );


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

    html = `
      ${escapeHtml(
        person.programStudi ||
        ''
      )}
    `;

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

    html = `
      ${escapeHtml(
        person.jenis ||
        ''
      )}
    `;

  }


  details.innerHTML =
    html;

}


/**
 * ============================
 * ERROR
 * ============================
 */

function showIdentityError(
  message
) {

  const error =
    document.getElementById(
      'identityError'
    );


  error.textContent =
    message;


  error.classList.remove(
    'hidden'
  );

}


function showError(
  message
) {

  const noActivity =
    document.getElementById(
      'noActivity'
    );


  noActivity
    .querySelector('p')
    .textContent =
      message;


  noActivity
    .classList.remove(
      'hidden'
    );

}


/**
 * ============================
 * SECURITY
 * ============================
 */

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
