// Default materials and their prices per unit
const defaultMaterials = [
  { name: "Cement", unit: "Bags", lowPrice: 350, midPrice: 400, highPrice: 450, factor: 0.4, scaleWithFloors: true },
  { name: "Sand", unit: "Cubic ft", lowPrice: 50, midPrice: 60, highPrice: 75, factor: 1.25, scaleWithFloors: true },
  { name: "Aggregate", unit: "Cubic ft", lowPrice: 40, midPrice: 50, highPrice: 65, factor: 0.9, scaleWithFloors: true },
  { name: "Steel", unit: "Kg", lowPrice: 65, midPrice: 75, highPrice: 85, factor: 5, scaleWithFloors: true },
  { name: "Bricks", unit: "Nos", lowPrice: 7, midPrice: 9, highPrice: 12, factor: 10, scaleWithFloors: true },
  { name: "Flooring", unit: "Sq ft", lowPrice: 40, midPrice: 80, highPrice: 150, factor: 1, scaleWithFloors: false },
  { name: "Wood", unit: "Cubic ft", lowPrice: 800, midPrice: 1200, highPrice: 2000, factor: 0.08, scaleWithFloors: false },
  { name: "Paint", unit: "Liters", lowPrice: 200, midPrice: 300, highPrice: 450, factor: 0.15, scaleWithFloors: true },
  { name: "Electrical Wiring", unit: "Meters", lowPrice: 30, midPrice: 50, highPrice: 80, factor: 1.5, scaleWithFloors: false },
  { name: "Plumbing", unit: "Points", lowPrice: 500, midPrice: 800, highPrice: 1200, factor: 0.05, scaleWithFloors: false }
];

// Load materials from localStorage or use defaults
let materials = JSON.parse(localStorage.getItem('constructionMaterials')) || defaultMaterials;

// Admin password (in a real app, this would be handled securely on a server)
const adminPass = "admin123";

// Add event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  // Main calculator
  document.getElementById('calculateBtn').addEventListener('click', calculateMaterials);

  // Admin panel
  document.getElementById('adminLoginBtn').addEventListener('click', showAdminLogin);
  document.getElementById('adminLoginConfirm').addEventListener('click', validateAdminLogin);
  document.getElementById('savePriceChanges').addEventListener('click', savePriceChanges);
  document.getElementById('logoutBtn').addEventListener('click', adminLogout);
  document.getElementById('addNewMaterial').addEventListener('click', addNewMaterial);

  // Admin tabs
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');
      switchAdminTab(tabName);
    });
  });

  // Set up main tab functionality
  const tabButtons = document.querySelectorAll('.tablinks');
  const tabContents = document.querySelectorAll('.tabcontent');

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', function () {
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.style.display = 'none');

      // Activate clicked tab
      this.classList.add('active');
      tabContents[index].style.display = 'block';
    });
  });

  // Initialize admin tables
  populateAdminTable();
  populateManageMaterialsTable();
});

// Switch between admin tabs
function switchAdminTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.admin-tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Deactivate all tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Activate the selected tab
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`.admin-tab[data-tab="${tabName}"]`).classList.add('active');
}

// Function to calculate materials required
function calculateMaterials() {
  const buildingArea = parseFloat(document.getElementById('buildingArea').value);
  const floors = parseInt(document.getElementById('floors').value);
  const parkingArea = parseFloat(document.getElementById('parkingArea').value) || 0;

  // Validate input
  if (!buildingArea || buildingArea <= 0) {
    alert("Please enter a valid building area.");
    return;
  }

  // Calculate total area available
  const plotArea = 30 * 40; // 1200 sq ft

  // Ground floor area calculation (accounting for parking)
  const groundFloorArea = Math.min(buildingArea, plotArea - parkingArea);

  // Upper floors can use the full plot area (1200 sq ft each)
  let totalBuildingArea = groundFloorArea;

  // Calculate maximum possible area for the given number of floors
  // First floor has parking restriction, upper floors can use full 1200 sq ft
  const maxBuildableArea = (plotArea - parkingArea) + (plotArea * (floors - 1));

  if (buildingArea > maxBuildableArea) {
    alert(`With ${parkingArea} sq ft for parking, the maximum buildable area for ${floors} floor(s) is ${maxBuildableArea} sq ft.`);
    return;
  }

  // For multi-floor buildings, allocate area appropriately
  let remainingArea = buildingArea - groundFloorArea;
  let floorAreas = [groundFloorArea];

  // Distribute remaining area among upper floors
  for (let i = 1; i < floors; i++) {
    if (remainingArea <= 0) {
      floorAreas.push(0);
    } else {
      const floorArea = Math.min(remainingArea, plotArea);
      floorAreas.push(floorArea);
      remainingArea -= floorArea;
    }
  }

  // Calculate material quantities based on building area
  const materialQuantities = materials.map(material => {
    let quantity = 0;

    if (material.scaleWithFloors) {
      // For materials that scale with floors, calculate per floor
      floorAreas.forEach(area => {
        quantity += area * material.factor;
      });
    } else {
      // For materials that don't scale with floors (like flooring),
      // use the total building area
      quantity = buildingArea * material.factor;
    }

    return {
      name: material.name,
      quantity: Math.ceil(quantity),
      unit: material.unit
    };
  });

  // Populate tables
  populateMaterialsTable(materialQuantities);
  populatePriceTable(materialQuantities);
  calculateTotalCosts(materialQuantities);

  // Show results
  document.getElementById('results').classList.remove('hidden');

  // Reset to first tab
  const tabButtons = document.querySelectorAll('.tablinks');
  const tabContents = document.querySelectorAll('.tabcontent');

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.style.display = 'none');

  tabButtons[0].classList.add('active');
  tabContents[0].style.display = 'block';

  // Set building summary with floor breakdown
  const buildingSummary = document.getElementById('buildingSummary');
  let floorDetails = '';

  floorAreas.forEach((area, index) => {
    if (area > 0) {
      floorDetails += `<p><strong>Floor ${index + 1}:</strong> ${area.toFixed(2)} sq. ft</p>`;
    }
  });

  buildingSummary.innerHTML = `
                <p><strong>Plot Size:</strong> 30×40 (1200 sq. ft)</p>
                <p><strong>Total Building Area:</strong> ${buildingArea} sq. ft</p>
                <p><strong>Number of Floors:</strong> ${floors}</p>
                ${parkingArea > 0 ? `<p><strong>Parking Area:</strong> ${parkingArea} sq. ft</p>` : ''}
                <h4>Floor Breakdown:</h4>
                ${floorDetails}
            `;
}

// Populate the materials table
function populateMaterialsTable(materialQuantities) {
  const tableBody = document.getElementById('materialsTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  materialQuantities.forEach(item => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = item.name;
    row.insertCell(1).textContent = item.quantity.toLocaleString();
    row.insertCell(2).textContent = item.unit;
  });
}

// Populate the price breakdown table
function populatePriceTable(materialQuantities) {
  const tableBody = document.getElementById('priceTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  materialQuantities.forEach(item => {
    const material = materials.find(m => m.name === item.name);
    if (!material) return;

    const row = tableBody.insertRow();
    row.insertCell(0).textContent = item.name;
    row.insertCell(1).textContent = item.quantity.toLocaleString();
    row.insertCell(2).textContent = item.unit;
    row.insertCell(3).textContent = `₹${(item.quantity * material.lowPrice).toLocaleString()}`;
    row.insertCell(4).textContent = `₹${(item.quantity * material.midPrice).toLocaleString()}`;
    row.insertCell(5).textContent = `₹${(item.quantity * material.highPrice).toLocaleString()}`;
  });
}

// Calculate and display total costs
function calculateTotalCosts(materialQuantities) {
  let lowTotal = 0;
  let midTotal = 0;
  let highTotal = 0;

  materialQuantities.forEach(item => {
    const material = materials.find(m => m.name === item.name);
    if (!material) return;

    lowTotal += item.quantity * material.lowPrice;
    midTotal += item.quantity * material.midPrice;
    highTotal += item.quantity * material.highPrice;
  });

  // Add labor costs (approximately 40% of material costs)
  lowTotal *= 1.4;
  midTotal *= 1.4;
  highTotal *= 1.4;

  document.getElementById('lowRangeTotal').textContent = `₹${Math.round(lowTotal).toLocaleString()}`;
  document.getElementById('midRangeTotal').textContent = `₹${Math.round(midTotal).toLocaleString()}`;
  document.getElementById('highRangeTotal').textContent = `₹${Math.round(highTotal).toLocaleString()}`;
}

// Show admin login panel
function showAdminLogin() {
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('adminLoginForm').style.display = 'block';
  document.getElementById('adminContent').classList.add('hidden');
  document.getElementById('adminPassword').value = ''; // Clear password field
}

// Admin logout
function adminLogout() {
  document.getElementById('adminLoginForm').style.display = 'block';
  document.getElementById('adminContent').classList.add('hidden');
  document.getElementById('adminPassword').value = '';
}

// Validate admin login
function validateAdminLogin() {
  const password = document.getElementById('adminPassword').value;
  if (password === adminPass) {
    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('adminContent').classList.remove('hidden');
    populateAdminTable();
    populateManageMaterialsTable();
  } else {
    alert("Incorrect password!");
  }
}

// Populate the admin materials table for price editing
function populateAdminTable() {
  const tableBody = document.getElementById('adminMaterialTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  materials.forEach((material, index) => {
    const row = tableBody.insertRow();

    row.insertCell(0).textContent = material.name;
    row.insertCell(1).textContent = material.unit;

    const lowPriceCell = row.insertCell(2);
    const lowPriceInput = document.createElement('input');
    lowPriceInput.type = 'number';
    lowPriceInput.min = '0';
    lowPriceInput.value = material.lowPrice;
    lowPriceInput.dataset.index = index;
    lowPriceInput.dataset.type = 'lowPrice';
    lowPriceCell.appendChild(lowPriceInput);

    const midPriceCell = row.insertCell(3);
    const midPriceInput = document.createElement('input');
    midPriceInput.type = 'number';
    midPriceInput.min = '0';
    midPriceInput.value = material.midPrice;
    midPriceInput.dataset.index = index;
    midPriceInput.dataset.type = 'midPrice';
    midPriceCell.appendChild(midPriceInput);

    const highPriceCell = row.insertCell(4);
    const highPriceInput = document.createElement('input');
    highPriceInput.type = 'number';
    highPriceInput.min = '0';
    highPriceInput.value = material.highPrice;
    highPriceInput.dataset.index = index;
    highPriceInput.dataset.type = 'highPrice';
    highPriceCell.appendChild(highPriceInput);
  });
}

// Populate the manage materials table
function populateManageMaterialsTable() {
  const tableBody = document.getElementById('manageMaterialsTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  materials.forEach((material, index) => {
    const row = tableBody.insertRow();

    row.insertCell(0).textContent = material.name;
    row.insertCell(1).textContent = material.unit;

    const factorCell = row.insertCell(2);
    const factorInput = document.createElement('input');
    factorInput.type = 'number';
    factorInput.min = '0';
    factorInput.step = '0.01';
    factorInput.value = material.factor;
    factorInput.dataset.index = index;
    factorInput.dataset.type = 'factor';
    factorCell.appendChild(factorInput);

    const scaleCell = row.insertCell(3);
    const scaleSelect = document.createElement('select');

    const yesOption = document.createElement('option');
    yesOption.value = 'true';
    yesOption.textContent = 'Yes';

    const noOption = document.createElement('option');
    noOption.value = 'false';
    noOption.textContent = 'No';

    scaleSelect.appendChild(yesOption);
    scaleSelect.appendChild(noOption);

    scaleSelect.value = material.scaleWithFloors.toString();
    scaleSelect.dataset.index = index;
    scaleSelect.dataset.type = 'scaleWithFloors';
    scaleCell.appendChild(scaleSelect);

    const actionsCell = row.insertCell(4);
    actionsCell.className = 'action-cell';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn-small';
    editBtn.addEventListener('click', () => editMaterial(index));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn-small red-btn';
    deleteBtn.addEventListener('click', () => deleteMaterial(index));

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
  });
}

// Save price changes from admin panel
function savePriceChanges() {
  const inputs = document.querySelectorAll('#adminMaterialTable input');

  inputs.forEach(input => {
    const index = parseInt(input.dataset.index);
    const type = input.dataset.type;
    const value = parseFloat(input.value);

    if (!isNaN(value) && value >= 0) {
      materials[index][type] = value;
    }
  });

  // Save to localStorage
  localStorage.setItem('constructionMaterials', JSON.stringify(materials));

  alert("Prices updated successfully!");

  // Recalculate if results are showing
  if (!document.getElementById('results').classList.contains('hidden')) {
    calculateMaterials();
  }
}

// Add new material
// Function to add new material
function addNewMaterial() {
  const name = document.getElementById('newMaterialName').value;
  const unit = document.getElementById('newMaterialUnit').value;
  const lowPrice = parseFloat(document.getElementById('newMaterialLowPrice').value);
  const midPrice = parseFloat(document.getElementById('newMaterialMidPrice').value);
  const highPrice = parseFloat(document.getElementById('newMaterialHighPrice').value);
  const factor = parseFloat(document.getElementById('newMaterialFactor').value);
  const scaleWithFloors = document.getElementById('newMaterialScaleWithFloors').value === 'yes';

  // Validate inputs
  if (!name || !unit || isNaN(lowPrice) || isNaN(midPrice) || isNaN(highPrice) || isNaN(factor)) {
    alert("Please fill all fields with valid values.");
    return;
  }

  // Create new material object
  const newMaterial = {
    name,
    unit,
    lowPrice,
    midPrice,
    highPrice,
    factor,
    scaleWithFloors
  };

  // Add to materials array
  materials.push(newMaterial);

  // Save to localStorage
  localStorage.setItem('constructionMaterials', JSON.stringify(materials));

  // Clear form
  document.getElementById('newMaterialName').value = '';
  document.getElementById('newMaterialUnit').value = '';
  document.getElementById('newMaterialLowPrice').value = '';
  document.getElementById('newMaterialMidPrice').value = '';
  document.getElementById('newMaterialHighPrice').value = '';
  document.getElementById('newMaterialFactor').value = '';
  document.getElementById('newMaterialScaleWithFloors').value = 'yes';

  // Refresh tables
  populateAdminTable();
  populateManageMaterialsTable();

  alert("New material added successfully!");
}

// Edit material
function editMaterial(index) {
  const material = materials[index];

  // Populate the form with existing values
  document.getElementById('newMaterialName').value = material.name;
  document.getElementById('newMaterialUnit').value = material.unit;
  document.getElementById('newMaterialLowPrice').value = material.lowPrice;
  document.getElementById('newMaterialMidPrice').value = material.midPrice;
  document.getElementById('newMaterialHighPrice').value = material.highPrice;
  document.getElementById('newMaterialFactor').value = material.factor;
  document.getElementById('newMaterialScaleWithFloors').value = material.scaleWithFloors ? 'yes' : 'no';

  // Remove the old material
  materials.splice(index, 1);

  // Refresh tables
  populateAdminTable();
  populateManageMaterialsTable();

  // Scroll to the form
  document.querySelector('.new-material-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete material
function deleteMaterial(index) {
  if (confirm(`Are you sure you want to delete ${materials[index].name}?`)) {
    materials.splice(index, 1);

    // Save to localStorage
    localStorage.setItem('constructionMaterials', JSON.stringify(materials));

    // Refresh tables
    populateAdminTable();
    populateManageMaterialsTable();

    alert("Material deleted successfully!");
  }
}

// Save factor and scale changes
document.getElementById('manageMaterialsTable').addEventListener('change', function (e) {
  const target = e.target;
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
    const index = parseInt(target.dataset.index);
    const type = target.dataset.type;

    if (type === 'factor') {
      const value = parseFloat(target.value);
      if (!isNaN(value) && value >= 0) {
        materials[index][type] = value;
      }
    } else if (type === 'scaleWithFloors') {
      materials[index][type] = target.value === 'true';
    }

    // Save to localStorage
    localStorage.setItem('constructionMaterials', JSON.stringify(materials));
  }
});

// Reset to default materials
function resetToDefaults() {
  if (confirm("Are you sure you want to reset all materials to default values?")) {
    materials = [...defaultMaterials];
    localStorage.setItem('constructionMaterials', JSON.stringify(materials));

    populateAdminTable();
    populateManageMaterialsTable();

    alert("Materials reset to default values.");
  }
}

// Add reset button to admin panel
document.addEventListener('DOMContentLoaded', function () {
  const adminContent = document.getElementById('adminContent');
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset to Defaults';
  resetBtn.className = 'red-btn';
  resetBtn.style.marginRight = '10px';
  resetBtn.addEventListener('click', resetToDefaults);

  // Insert before logout button
  adminContent.insertBefore(resetBtn, document.getElementById('logoutBtn'));
});