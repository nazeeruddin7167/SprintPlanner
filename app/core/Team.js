// Team domain class

class Team {
	constructor(name, members, sprints) {
		this.name = name;
		this.members = members || [];
		this.sprints = sprints || [];
	}
}

module.exports = { Team };
