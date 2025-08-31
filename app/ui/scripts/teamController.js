// Make clicking anywhere on the date input open the calendar
document.addEventListener('DOMContentLoaded', function() {
  const sprintStart = document.getElementById('sprint-start');
  const sprintEnd = document.getElementById('sprint-end');
  if (sprintStart) {
    sprintStart.addEventListener('focus', function() { this.showPicker && this.showPicker(); });
    sprintStart.addEventListener('click', function() { this.showPicker && this.showPicker(); });
  }
  if (sprintEnd) {
    sprintEnd.addEventListener('focus', function() { this.showPicker && this.showPicker(); });
    sprintEnd.addEventListener('click', function() { this.showPicker && this.showPicker(); });
  }
});
// Team controller logic

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const fs = require('fs');
const path = require('path');
const teamsPath = path.join(__dirname, '../data/teams.json');

let members = [];
let teamName = getQueryParam('team');
let teams = [];
let team = null;

function loadTeamMembers() {
  try {
    const data = fs.readFileSync(teamsPath, 'utf-8');
    teams = JSON.parse(data);
    team = teams.find(t => t.name === teamName);
    if (team && Array.isArray(team.members)) {
      members = team.members;
    } else {
      members = [];
    }
  } catch {
    members = [];
  }
}

function renderMemberRows() {
  const tbody = document.getElementById('capacity-table-body');
  tbody.innerHTML = '';
  if (members.length > 0) {
    members.forEach(name => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="name-col"><input type="text" value="${name}" placeholder="Name" readonly /></td>
        <td><input type="number" class="total-capacity-cell" placeholder="0" /></td>
        <td><input type="number" class="leaves-cell" placeholder="0" /></td>
        <td><input type="number" class="scrum-adhoc-cell" placeholder="0" /></td>
        <td><input type="number" class="available-capacity-cell" placeholder="0" readonly /></td>
        <td><input type="number" class="relative-capacity-cell" placeholder="0" value="0" readonly /></td>
        <td><input type="number" class="spillover-cell" placeholder="0" /></td>
        <td><input type="text" class="spillover-reason-cell" placeholder="Reason" /></td>
        <td class="total-sp-col"><input type="number" class="total-sp-cell" placeholder="0" /></td>
        <td><textarea class="tasks-cell" placeholder="1. "></textarea></td>
        <td><button class="delete-row-btn" type="button" style="display:none" onclick="this.closest('tr').remove()">X</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function getRelativeCapacity(avail) {
  if (avail >= 10) return 16;
  if (avail === 9) return 14;
  if (avail === 8) return 13;
  if (avail === 7) return 11;
  if (avail === 6) return 10;
  if (avail === 5) return 8;
  if (avail === 4) return 7;
  if (avail === 3) return 5;
  if (avail === 2) return 3;
  if (avail === 1) return 2;
  return 0;
}

function updateAvailableCapacity() {
  const rows = document.querySelectorAll('#capacity-table-body tr');
  rows.forEach(row => {
    const total = Number(row.querySelector('.total-capacity-cell')?.value) || 0;
    const leaves = Number(row.querySelector('.leaves-cell')?.value) || 0;
    const scrum = Number(row.querySelector('.scrum-adhoc-cell')?.value) || 0;
    const available = total - leaves - scrum;
    const availableInput = row.querySelector('.available-capacity-cell');
    if (availableInput) availableInput.value = available;
    // Set relative capacity
    const relInput = row.querySelector('.relative-capacity-cell');
    let relCap = 0;
    if (relInput) {
      relCap = getRelativeCapacity(available);
      relInput.value = relCap;
    }
    // Set total sp committed = relative capacity - spillover
    const spillover = Number(row.querySelector('.spillover-cell')?.value) || 0;
    const totalSpInput = row.querySelector('.total-sp-cell');
    if (totalSpInput) totalSpInput.value = relCap - spillover;
  });
}

function saveMembersToJson() {
  if (!team) return;
  // Get all member names from the table
  const tbody = document.getElementById('capacity-table-body');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const newMembers = rows.map(row => row.querySelector('td input[type="text"]').value.trim()).filter(Boolean);
  team.members = newMembers;
  // Save back to teams.json
  fs.writeFileSync(teamsPath, JSON.stringify(teams, null, 2), 'utf-8');
}

window.addEventListener('DOMContentLoaded', function() {
  // Always set the sprint action button text to 'Save'
  const sprintActionBtn = document.getElementById('sprint-action-btn');
  if (sprintActionBtn) sprintActionBtn.textContent = 'Save';
  // Get sprint index from query param if editing
  const sprintIndex = getQueryParam('sprint'); 

  // Helper to gather all sprint data from form/table
  function getSprintFormData() {
    const name = document.getElementById('sprint-name').value.trim();
    const startDate = document.getElementById('sprint-start').getAttribute('data-iso') || document.getElementById('sprint-start').value;
    const endDate = document.getElementById('sprint-end').getAttribute('data-iso') || document.getElementById('sprint-end').value;
    // Gather member rows
    const rows = Array.from(document.querySelectorAll('#capacity-table-body tr'));
    const members = rows.map(row => {
      return {
        name: row.querySelector('td input[type="text"]').value.trim(),
        totalCapacity: Number(row.querySelector('.total-capacity-cell')?.value) || 0,
        leaves: Number(row.querySelector('.leaves-cell')?.value) || 0,
        scrumAdhoc: Number(row.querySelector('.scrum-adhoc-cell')?.value) || 0,
        available: Number(row.querySelector('.available-capacity-cell')?.value) || 0,
        relativeCapacity: Number(row.querySelector('.relative-capacity-cell')?.value) || 0,
        spillover: Number(row.querySelector('.spillover-cell')?.value) || 0,
        spilloverReason: row.querySelector('.spillover-reason-cell')?.value || '',
        totalSp: Number(row.querySelector('.total-sp-cell')?.value) || 0,
        tasks: row.querySelector('.tasks-cell')?.value || ''
      };
    });
    // Calculate total capacity planned (sum of relativeCapacity)
    const capacity = members.reduce((sum, m) => sum + (m.relativeCapacity || 0), 0);
    return { name, startDate, endDate, capacity, members };
  }
  // No custom formatting for native date input fields. Let browser handle date display and selection.
  // Auto-expand textarea height as user types
  function autoExpandTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }

  // Tasks cell auto-numbering
  function handleTasksAutoNumbering(e) {
  // After adding a new line, auto-expand
  setTimeout(() => autoExpandTextarea(e.target), 0);
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.target;
      const lines = textarea.value.split('\n');
      let nextNum = lines.length + 1;
      textarea.value += `\n${nextNum}. `;
      // Move cursor to end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  }
  function attachTasksListeners() {
    document.querySelectorAll('.tasks-cell').forEach(textarea => {
  textarea.addEventListener('keydown', handleTasksAutoNumbering);
  textarea.addEventListener('input', function() { autoExpandTextarea(textarea); });
  // If empty, start with 1.
  if (!textarea.value) textarea.value = '1. ';
  autoExpandTextarea(textarea);
    });
  }

  // Prevent Enter key from submitting the form and navigating away
  document.getElementById('sprint-form').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });

  loadTeamMembers();
  renderMemberRows();
  attachTasksListeners();
  // Hide all delete buttons initially
  const hideDeleteBtns = () => {
    const btns = document.querySelectorAll('.delete-row-btn');
    btns.forEach(btn => {
      btn.style.display = 'none';
    });
  };
  hideDeleteBtns();

  // Add team member
  document.getElementById('add-team-member').onclick = function() {
    const tbody = document.getElementById('capacity-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" placeholder="Name" /></td>
      <td><input type="number" class="total-capacity-cell" placeholder="0" /></td>
      <td><input type="number" class="leaves-cell" placeholder="0" /></td>
      <td><input type="number" class="scrum-adhoc-cell" placeholder="0" /></td>
      <td><input type="number" class="available-capacity-cell" placeholder="0" readonly /></td>
      <td><input type="number" class="relative-capacity-cell" placeholder="0" value="0" readonly /></td>
      <td><input type="number" class="spillover-cell" placeholder="0" /></td>
      <td><input type="text" class="spillover-reason-cell" placeholder="Reason" /></td>
      <td><input type="number" class="total-sp-cell" placeholder="0" /></td>
      <td><textarea class="tasks-cell" placeholder="1. "></textarea></td>
      <td><button class="delete-row-btn" type="button" style="display:none" onclick="this.closest('tr').remove()">X</button></td>
    `;
    tbody.appendChild(tr);
    attachCapacityListeners();
    attachTasksListeners();

    // Also add to team's members array in teams.json if not present
    setTimeout(() => {
      const nameInput = tr.querySelector('input[type="text"]');
      if (nameInput) {
        nameInput.addEventListener('blur', function() {
          const newName = nameInput.value.trim();
          if (newName) {
            try {
              const data = fs.readFileSync(teamsPath, 'utf-8');
              const teamsArr = JSON.parse(data);
              const teamObj = teamsArr.find(t => t.name === teamName);
              if (teamObj && Array.isArray(teamObj.members) && !teamObj.members.includes(newName)) {
                teamObj.members.push(newName);
                fs.writeFileSync(teamsPath, JSON.stringify(teamsArr, null, 2), 'utf-8');
              }
            } catch (e) { /* ignore */ }
          }
        });
      }
    }, 0);
  };

  // Total capacity input populates all rows
  document.getElementById('total-capacity-input').addEventListener('input', function() {
    const value = this.value;
    document.querySelectorAll('.total-capacity-cell').forEach(input => {
      input.value = value;
    });
    updateAvailableCapacity();
  });

  // Default Scrum+Adhoc input populates all rows
  document.getElementById('default-scrum-adhoc-input').addEventListener('input', function() {
    const value = this.value;
    document.querySelectorAll('.scrum-adhoc-cell').forEach(input => {
      input.value = value;
    });
    updateAvailableCapacity();
  });

  // Attach listeners to update available capacity
  function attachCapacityListeners() {
    document.querySelectorAll('.leaves-cell, .scrum-adhoc-cell, .total-capacity-cell, .spillover-cell').forEach(input => {
      input.addEventListener('input', updateAvailableCapacity);
    });
  }
  attachCapacityListeners();

  // Remove team member (toggle delete buttons)
  let removeMode = false;
  document.getElementById('toggle-remove-member').onclick = function() {
    removeMode = !removeMode;
    const btns = document.querySelectorAll('.delete-row-btn');
    btns.forEach(btn => {
      btn.style.display = removeMode ? 'inline-block' : 'none';
      btn.onclick = function() {
        this.closest('tr').remove();
        saveMembersToJson();
      };
    });
  };

  // Cancel button: go back to sprint.html without saving
  document.querySelector('.sprint-cancel-btn').onclick = function(e) {
    e.preventDefault();
    showLoading();
    setTimeout(() => {
      window.location.href = 'sprint.html?team=' + encodeURIComponent(teamName);
    }, 100);
  };

  // Save members to JSON on create (optional, can be extended for full sprint save)
  document.querySelector('.sprint-create-btn').onclick = function(e) {
    e.preventDefault();
    showLoading();
    setTimeout(() => {
      // Force blur on all name inputs to ensure latest values are captured
      document.querySelectorAll('#capacity-table-body input[type="text"]').forEach(input => input.blur());
      // Load teams and team
      const data = fs.readFileSync(teamsPath, 'utf-8');
      const teamsArr = JSON.parse(data);
      const teamObj = teamsArr.find(t => t.name === teamName);
      if (!teamObj) return;
      if (!Array.isArray(teamObj.sprints)) teamObj.sprints = [];
      const sprintData = getSprintFormData();
      // Sync team's members array to exactly match the sprint table (additions and deletions)
      const allNames = sprintData.members.map(m => (m.name || '').trim()).filter(Boolean);
      teamObj.members = Array.from(new Set(allNames));
      if (sprintIndex !== null && sprintIndex !== undefined && sprintIndex !== '' && !isNaN(Number(sprintIndex))) {
        // Edit existing sprint
        teamObj.sprints[Number(sprintIndex)] = sprintData;
      } else {
        // Add new sprint
        teamObj.sprints.push(sprintData);
      }
      fs.writeFileSync(teamsPath, JSON.stringify(teamsArr, null, 2), 'utf-8');
      window.location.href = 'sprint.html?team=' + encodeURIComponent(teamName);
    }, 100);
  };
// Loading overlay helpers
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
}
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}
  // If editing, preload values
  if (sprintIndex !== null && sprintIndex !== undefined && sprintIndex !== '' && !isNaN(Number(sprintIndex))) {
    try {
      const data = fs.readFileSync(teamsPath, 'utf-8');
      const teamsArr = JSON.parse(data);
      const teamObj = teamsArr.find(t => t.name === teamName);
      if (teamObj && Array.isArray(teamObj.sprints) && teamObj.sprints[Number(sprintIndex)]) {
        const sprint = teamObj.sprints[Number(sprintIndex)];
        document.getElementById('sprint-name').value = sprint.name || '';
        document.getElementById('sprint-start').value = sprint.startDate || '';
        document.getElementById('sprint-end').value = sprint.endDate || '';
        // Preload member rows
        if (Array.isArray(sprint.members)) {
          const tbody = document.getElementById('capacity-table-body');
          tbody.innerHTML = '';
          sprint.members.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td class="name-col"><input type="text" value="${m.name || ''}" placeholder="Name" readonly /></td>
              <td><input type="number" class="total-capacity-cell" placeholder="0" value="${m.totalCapacity || 0}" /></td>
              <td><input type="number" class="leaves-cell" placeholder="0" value="${m.leaves || 0}" /></td>
              <td><input type="number" class="scrum-adhoc-cell" placeholder="0" value="${m.scrumAdhoc || 0}" /></td>
              <td><input type="number" class="available-capacity-cell" placeholder="0" value="${m.available || 0}" readonly /></td>
              <td><input type="number" class="relative-capacity-cell" placeholder="0" value="${m.relativeCapacity || 0}" readonly /></td>
              <td><input type="number" class="spillover-cell" placeholder="0" value="${m.spillover || 0}" /></td>
              <td><input type="text" class="spillover-reason-cell" placeholder="Reason" value="${m.spilloverReason || ''}" /></td>
              <td class="total-sp-col"><input type="number" class="total-sp-cell" placeholder="0" value="${m.totalSp || 0}" /></td>
              <td><textarea class="tasks-cell" placeholder="1. ">${m.tasks || ''}</textarea></td>
              <td><button class="delete-row-btn" type="button" style="display:none" onclick="this.closest('tr').remove()">X</button></td>
            `;
            tbody.appendChild(tr);
          });
        }
      }
    } catch (e) { /* ignore */ }
  }
});
