/*
    Copyright (c) 2025 LBTH DDC&IU
    Created: 07 Feb 2025
    Description: Index js page for DDC&UI Products
    License: All Rights Reserved.

    This code is proprietary and confidential. Unauthorized distribution or modification outside of the authorized team is prohibited.

    Modification Rules:
    - DDC&IU Team members may modify the code but must document their changes in the Change Log.
    - External parties are not permitted to use, modify, or distribute this code.


    Change Log:
    - 07 Feb 2025: Initial creation (with reference style) (Jiayan Fan)
    - 13 Feb 2025: Modify title and navigation bar (modifier: Jiayan Fan)
    - 19 Feb 2025: Code framework modification (modifier: Jiayan Fan)
*/

// Script to open and close sidebar
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
}

function filterProjects(category) {
  const items = document.querySelectorAll('[data-category]');
  const buttons = document.querySelectorAll('.custom-filter-btn');

  // Logic
  items.forEach(item => {
    const itemCategory = item.getAttribute('data-category');
    const shouldShow = category === 'all' || itemCategory === category;
    item.style.display = shouldShow ? 'block' : 'none';
  });

  // Bottom
  buttons.forEach(btn => {
    const btnCategory = btn.getAttribute('data-filter');
    btn.classList.toggle('active-filter', btnCategory === category);
  });
}

// Monitor
document.addEventListener('click', (e) => {
  const button = e.target.closest('.custom-filter-btn');
  if (button) {
    const category = button.getAttribute('data-filter');
    filterProjects(category);
  }
});

// Default
window.addEventListener('DOMContentLoaded', () => filterProjects('all'));

document.addEventListener('DOMContentLoaded', function() {
  fetch('data/index/product.csv')
      .then(response => response.text())
      .then(csvText => {
          const text = csvText.replace(/^\uFEFF/, '');
          const projects = parseCSV(text);
          
          // output
          console.log('Parsed Projects Data:', projects);
          
          renderProjects(projects);
      })
      .catch(error => console.error('Error:', error));

      function parseCSV(text) {
          const rows = text.split('\n').filter(row => row.trim() !== '');
          const headers = rows[0].split(',').map(h => h.trim()); 
          
          return rows.slice(1).map(row => {
              const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
              const values = row.split(regex).map(field => {
                  return field.replace(/^"|"$/g, '').trim(); 
              });
              
              if (values.length !== headers.length) {
                  console.error('not match:', row);
                  return null;
              }
              
              return headers.reduce((obj, header, index) => {
                  obj[header] = values[index] || '';
                  return obj;
              }, {});
          }).filter(project => project !== null); 
      }

  function renderProjects(projects) {
      const container = document.getElementById('projects-container');
      let html = '';

      projects.forEach(project => {
          html += `
              <div class="w3-third w3-container w3-margin-bottom" data-category="${project.category}">
                  ${project.link !== '#none' ? `<a href="${project.link}">` : ''}
                      <img src="${project.image}" alt="${project.alt}" style="width:100%" class="w3-hover-opacity">
                  ${project.link !== '#none' ? `</a>` : ''}
                  <div class="w3-container w3-white">
                      <p><b>${project.title}</b></p>
                      <p>${project.description}</p>
                  </div>
              </div>
          `;
      });

      container.innerHTML = html;
  }
});