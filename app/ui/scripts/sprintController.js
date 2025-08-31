// Redirect to team.html for sprint creation
const createSprintBtn = document.getElementById('create-sprint-btn');
if (createSprintBtn) {
	createSprintBtn.onclick = function() {
		window.location.href = `team.html?team=${encodeURIComponent(teamName)}`;
	};
}
// sprintController.js
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
			return arr.map(obj => new Team(obj.name, obj.members, obj.sprints));
		}
	} catch (e) {
		console.error('Error loading teams:', e);
	}
	return [];
}


function saveTeams(teams) {
	fs.writeFileSync(teamsFilePath, JSON.stringify(teams, null, 2), 'utf-8');
}

function getQueryParam(name) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}

function loadTeams() {
		try {
			if (fs.existsSync(teamsFilePath)) {
				const data = fs.readFileSync(teamsFilePath, 'utf-8');
				const arr = JSON.parse(data);
				return arr.map(obj => new Team(obj.name, obj.members, obj.sprints));
			}
		} catch (e) {
			console.error('Error loading teams:', e);
		}
		return [];
}

function renderTeamInfo(team, members) {
	const teamNameEl = document.getElementById('team-name');
	const teamMembersEl = document.getElementById('team-members');
	if (!team) {
		teamNameEl.textContent = 'Team not found';
		teamMembersEl.textContent = '';
		return;
	}
	teamNameEl.textContent = team.name + ' Sprint Planning Dashboard';
	if (members.length === 0) {
		teamMembersEl.innerHTML = '<span>Members: Add members to start planning!</span>';
	} else {
		// Render members as comma-separated, with remove buttons hidden by default
		teamMembersEl.innerHTML = '<span>Members:</span> ' + members.map((m, idx) =>
			`<span class="member-item">${m}<button class="remove-member-btn" data-idx="${idx}" title="Remove" style="display:none;margin-left:4px">&times;</button></span>`
		).join(', ');
		// Attach remove handlers
		Array.from(teamMembersEl.getElementsByClassName('remove-member-btn')).forEach(btn => {
			btn.onclick = function() {
				const idx = parseInt(this.getAttribute('data-idx'));
				removeMemberByIndex(idx);
			};
		});
	}
// Toggle remove buttons for members
let removeMode = false;
document.getElementById('toggle-remove-member-btn').onclick = function() {
	removeMode = !removeMode;
	const btns = document.getElementsByClassName('remove-member-btn');
	for (let i = 0; i < btns.length; i++) {
		btns[i].style.display = removeMode ? 'inline-block' : 'none';
	}
};
}

document.getElementById('back-btn').onclick = function() {
	window.location.href = 'dashboard.html';
};


// Main logic
const teamName = getQueryParam('team');
let teams = loadTeams();
let team = teams.find(t => t.name === teamName);
let members = team && Array.isArray(team.members) ? team.members : [];
renderTeamInfo(team, members);


// Render sprints table or empty message
function renderSprintsTable() {
	const sprintTableContainer = document.getElementById('sprint-table-container');
	const sprintEmpty = document.getElementById('sprint-empty');
	const sprintTableBody = document.getElementById('sprint-table-body');
	if (team && Array.isArray(team.sprints) && team.sprints.length > 0) {
		sprintTableContainer.style.display = '';
		sprintEmpty.style.display = 'none';
		sprintTableBody.innerHTML = '';
		team.sprints.forEach((sprint, idx) => {
			const tr = document.createElement('tr');
			tr.innerHTML = `
				<td>${sprint.name}</td>
				<td>${sprint.startDate} - ${sprint.endDate}</td>
				<td>Capacity planned: ${sprint.capacity}</td>
				<td>
					<div style="display: flex; gap: 0.5em;">
						<button class="edit-btn" data-idx="${idx}">Edit</button>
						<button class="export-btn" data-idx="${idx}">Export</button>
						<button class="delete-btn" data-idx="${idx}" style="display:none;">Delete</button>
					</div>
				</td>
			`;
			sprintTableBody.appendChild(tr);
		});
		// Add edit button listeners
		sprintTableBody.querySelectorAll('.edit-btn').forEach(btn => {
			btn.onclick = function() {
				const idx = btn.getAttribute('data-idx');
				window.location.href = `team.html?team=${encodeURIComponent(teamName)}&sprint=${idx}`;
			};
		});
		// Add delete button listeners
		sprintTableBody.querySelectorAll('.delete-btn').forEach(btn => {
			btn.onclick = function() {
				const idx = Number(btn.getAttribute('data-idx'));
				// Remove sprint from team and save (no confirm)
				let teamsArr = loadTeams();
				let teamObj = teamsArr.find(t => t.name === teamName);
				if (teamObj && Array.isArray(teamObj.sprints)) {
					teamObj.sprints.splice(idx, 1);
					saveTeams(teamsArr);
					// Refresh table
					teams = loadTeams();
					team = teams.find(t => t.name === teamName);
					renderSprintsTable();
				}
			};
		});
		// Export button functionality: call exportSprint.js
	const { exportSprintToExcel } = window.require('./scripts/exportSprint.js');
		sprintTableBody.querySelectorAll('.export-btn').forEach(btn => {
			btn.onclick = async function() {
				const idx = Number(btn.getAttribute('data-idx'));
				try {
					const filePath = await exportSprintToExcel(teamName, idx);
					alert('Exported to: ' + filePath);
				} catch (err) {
					alert('Export failed: ' + err.message);
				}
			};
		});
	} else {
		sprintTableContainer.style.display = 'none';
		sprintEmpty.style.display = '';
	}
}

renderSprintsTable();

// Toggle delete sprint buttons
const toggleDeleteSprintBtn = document.getElementById('toggle-delete-sprint-btn');
if (toggleDeleteSprintBtn) {
	toggleDeleteSprintBtn.onclick = function() {
		const btns = document.querySelectorAll('.delete-btn');
		btns.forEach(btn => {
			btn.style.display = btn.style.display === 'none' ? 'inline-block' : 'none';
		});
	};
}

// Add member logic
document.getElementById('add-member-btn').onclick = function() {
	const input = document.getElementById('member-name-input');
	const name = input.value;
	if (name && name.trim()) {
		teams = loadTeams();
		team = teams.find(t => t.name === teamName);
		if (!team.members) team.members = [];
		team.members.push(name.trim());
		saveTeams(teams);
		teams = loadTeams();
		team = teams.find(t => t.name === teamName);
		members = team && Array.isArray(team.members) ? team.members : [];
		renderTeamInfo(team, members);
		input.value = '';
	}
};

// Remove member logic

// Remove member by index (used by remove buttons)
function removeMemberByIndex(idx) {
	teams = loadTeams();
	team = teams.find(t => t.name === teamName);
	if (!team.members) team.members = [];
	team.members.splice(idx, 1);
	saveTeams(teams);
	teams = loadTeams();
	team = teams.find(t => t.name === teamName);
	members = team && Array.isArray(team.members) ? team.members : [];
	renderTeamInfo(team, members);
}

