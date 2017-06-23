module.exports = class TutorialData extends EventEmitter {

	constructor() {
		super();
		this.tutData = {
			"hide-dangerous-buttons": {
				title: 'Hide Dangerous Buttons',
				message: '<p><button class="btn btn-danger">Dangerous</button> buttons (indicated by their red color) are buttons that will make permenant changes to your remote servers.</p><p>Most of Connectopus\' functionality is around viewing differences in your data and code files.  You can view these differences safely, wihout making any remote changes by hiding dangerous buttons from being presented to the user.</p>'
			},
			"root-sftp-directory": {
				title: 'Root SFTP Directory',
				message: 'Specify what the root SFTP directory you wish to start with when comparing web application code.  In many cases, the root web directory is \'www\', however it can be set to anything you prefer.'
			},
			"add-table-to-block": {
				title: 'Add Table to Block',
				message: '<p>Adding tables to the block list can prevent users from accidently clicking on (and diffing) tables that shouldn\'t normally be compared with Connectopus.</p><p>Examples of tables you may want to block are <ol><li>large tables</li><li>tables that log local application activity and are not supposed to be in sync across servers</li><li>tables that are populated via web services, meaning the primary keys of the row data won\'t match so they shouldn\'t normally be compared</li><li>anything that breaks Connectopus.</li></ol></p>'
			},
			"blocked-tables": {
				title: 'Blocked Tables',
				message: '<p>Tables in the Blocked Tables list are not clickable when the user is comparing <span class="glyphicon glyphicon-hdd"></span>&nbsp;Content (database data). Removing tabels from this list will make them clickable/diffable.</p><p>You may want to block large tables, logs, and tables populated by outside services (to name a few).</p>'
			},
			"max-rows-requested": {
				title: 'Max Rows Requested',
				message: '<p>The maximum number of rows that will be requested to be compared with Connectopus.</p><p>Extremely large tables (in the millions of rows) will probably not perform well in Connectopus.</p><p>By default we limit Max Rows Requested to 100,000, but you can set it to anything you like.</p>'
			},
			"tuts-my-goots-icons": {
				title: 'Tuts My Goots Icons',
				message: '<p>That little blue question mark you just clicked on?... <span class="tuts-my-goots-icon" style="float: none;">?</span></p><p>...click the check box next to it to hide these.</p><p>Tuts My Goots will miss you :(</p>'
			},
			"tooltip-ballons": {
				title: 'Tooltip Balloons',
				message: 'Checking to "hide" the Tooltip Ballons will hide the <span class="tool-tip-example"> mouse-over balloons</span> that appear when diffing code files.'
			}
		}
	}

	getTut(id) {
		return this.tutData[id];
	}
}