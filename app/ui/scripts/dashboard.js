document.addEventListener('DOMContentLoaded', () => {
  const emptyState = document.getElementById('empty-state');
  const teamsList = document.getElementById('teams-list');

  const fs = require('fs');
  const path = require('path');
  const corePath = path.join(__dirname, '../core/Team.js');
  const { Team } = require(corePath);

  const teamsFilePath = path.join(__dirname, '../data/teams.json');

  function loadTeams() {
    try {
      if (fs.existsSync(teamsFilePath)) {
        const data = fs.readFileSync(teamsFilePath, 'utf-8');
        const arr = JSON.parse(data);
        return arr.map(obj => new Team(obj.name, obj.members));
      }
    } catch (e) {
      console.error('Error loading teams:', e);
    }
    return [];
  }

  function saveTeams(teams) {
    try {
      fs.writeFileSync(teamsFilePath, JSON.stringify(teams, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving teams:', e);
    }
  }


// Show custom modal for team name

function showTeamModal(callback) {
  const modal = document.getElementById('team-modal');
  const input = document.getElementById('team-name-input');
  const createBtn = document.getElementById('create-modal');
  const cancelBtn = document.getElementById('cancel-modal');
  const closeBtn = document.getElementById('close-modal');

  // Remove any previous event listeners
  createBtn.onclick = null;
  cancelBtn.onclick = null;
  closeBtn.onclick = null;
  input.onkeydown = null;

  function closeModal() {
    modal.style.display = 'none';
    input.value = '';
    createBtn.onclick = null;
    cancelBtn.onclick = null;
    closeBtn.onclick = null;
    input.onkeydown = null;
  }
  function onCreate() {
    const name = input.value.trim();
    if (name) {
      closeModal();
      callback(name);
    }
  }
  function onCancel() {
    closeModal();
  }
  function onEnter(e) {
    if (e.key === 'Enter') onCreate();
    if (e.key === 'Escape') onCancel();
  }
  modal.style.display = 'flex';
  input.value = '';
  createBtn.onclick = onCreate;
  cancelBtn.onclick = onCancel;
  closeBtn.onclick = onCancel;
  input.onkeydown = onEnter;
}

    let teams = loadTeams();

    let deleteMode = false;
    function renderTeams() {
      if (!teams.length) {
        emptyState.style.display = 'block';
        teamsList.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        teamsList.style.display = 'grid';
        teamsList.innerHTML = '';
        teams.forEach(team => {
          const card = document.createElement('div');
          card.className = 'team-card';
          card.innerHTML = `
            <button class="close-team-btn" title="Delete Team" style="display:${deleteMode ? 'block' : 'none'}">&times;</button>
            <div class="team-name">${team.name}</div>
            <div class="team-members">Members: ${Array.isArray(team.members) ? team.members.length : 0}</div>
          `;
          // Make the entire card clickable except the X button
          card.style.cursor = 'pointer';
          card.addEventListener('click', (e) => {
            if (!deleteMode && !e.target.classList.contains('close-team-btn')) {
              showLoading();
              setTimeout(() => {
                window.location.href = `sprint.html?team=${encodeURIComponent(team.name)}`;
              }, 100);
            }
          });
// Loading overlay helpers
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
}
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}
          // Add delete logic to the X button
          const closeBtn = card.querySelector('.close-team-btn');
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            teams = teams.filter(t => t !== team);
            saveTeams(teams);
            renderTeams();
          });
          teamsList.appendChild(card);
        });
      }
    }

    renderTeams();

    document.querySelector('.create-team-btn').addEventListener('click', () => {
      showTeamModal((teamName) => {
        const newTeam = new Team(teamName, 0);
        teams.push(newTeam);
        saveTeams(teams);
        renderTeams();
      });
    });

    // Delete Teams button logic
    const deleteTeamsBtn = document.querySelector('.delete-teams-btn');
    deleteTeamsBtn.addEventListener('click', () => {
      deleteMode = !deleteMode;
      deleteTeamsBtn.classList.toggle('active', deleteMode);
      renderTeams();
    });
});