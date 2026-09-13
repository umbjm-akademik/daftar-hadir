const API_URL = 'https://script.google.com/macros/s/AKfycbyNOS_an60Wt_Ozyfb0mGHlH3kJj9cjPYEdPZTIuLZguXFtxRURdDi_FllR3yNTsPR5/exec';


document.addEventListener('DOMContentLoaded', () => {

  loadActivities();

});


async function loadActivities() {

  const loading =
    document.getElementById('loading');

  try {

    const response = await fetch(API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },

      body: JSON.stringify({
        action: 'getActiveActivities'
      })
    });


    const data = await response.json();

    console.log('API RESPONSE:', data);


    loading.classList.add('hidden');


    if (
      data.success &&
      data.activities &&
      data.activities.length > 0
    ) {

      showActivities(data.activities);

    } else {

      document
        .getElementById('noActivity')
        .classList.remove('hidden');

    }


  } catch (error) {

    console.error(error);

    loading.classList.add('hidden');

    document
      .getElementById('noActivity')
      .classList.remove('hidden');

  }

}


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
        ${activity.start} – ${activity.end} WITA
      </div>
    `;


    button.addEventListener(
      'click',
      () => selectActivity(activity)
    );


    list.appendChild(button);

  });


  selection.classList.remove('hidden');

}


function selectActivity(activity) {

  console.log(
    'Selected activity:',
    activity
  );

}


function escapeHtml(text) {

  const div =
    document.createElement('div');

  div.textContent = text;

  return div.innerHTML;

}
