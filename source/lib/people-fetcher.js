// @TODO add wufoo result fetching
'use strict'

// Imports
const Person = require('./person')
const env = require('./env')

// Fetcher
module.exports = function (opts) {
	if ( !opts.log )  throw new Error('No log option was passed')
	const log = opts.log

	function fetchPeople (next) {
		// Prepare
		const tasks = require('taskgroup').TaskGroup.create().done(function (err) {
			if ( err )  return next(err)
			next(null, 'fetched')
		})

		// Tasks
		tasks.addTask('load people from the database', function (complete) {
			log('info', 'Loading people from the database...')
			Person.loadFromDatabase({}, function (err) {
				if ( err )  return complete(err)
				log('info', 'Loaded people from the database...')
				complete()
			})
		})

		/*
		tasks.addTask('load people from the CSV file', function (complete) {
			log('info', 'Loading people from the CSV file...')
			const opts = {
				path: '/Users/balupton/startup-hostel-people.csv',
				data: {
					startupHostelUser: true
				}
			}
			Person.loadFromCsv(opts, function (err) {
				if ( err )  return complete(err)
				log('info', 'Loaded people from the CSV file...')
				complete()
			})
		})
		*/

		// Load people from twitter
		function twitterTask (opts) {
			return function (complete) {
				log('info', 'Loading people from twitter...')
				Person.loadFromTwitter(opts, function (err) {
					if ( err )  return complete(err)
					log('info', 'Loaded people from twitter')
					complete()
				})
			}
		}
		tasks.addTask('load startuphostel twitter followers', twitterTask({
			twitterUsername: 'StartupHostel',
			data: {
				startupHostelUser: true
			}
		}))
		tasks.addTask('load docpad twitter followers', twitterTask({
			twitterUsername: 'DocPad',
			data: {
				docpadUser: true
			}
		}))
		tasks.addTask('load bevry twitter followers', twitterTask({
			twitterUsername: 'BevryMe',
			data: {}
		}))

		// Load people from campaign monitor
		function subscriberTask (opts) {
			return function (complete) {
				log('info', 'Loading people from campaign monitor...')
				Person.loadFromCampaignMonitor(opts, function (err) {
					if ( err )  return complete(err)
					log('info', 'Loaded people from campaign monitor')
					complete()
				})
			}
		}
		tasks.addTask('load startuphostel subscribers', subscriberTask({
			campaignMonitorListId: env.startuphostel.campaignMonitorListId,
			data: {
				startupHostelUser: true
			}
		}))
		tasks.addTask('load docpad subscribers', subscriberTask({
			campaignMonitorListId: env.docpad.campaignMonitorListId,
			data: {
				docpadUser: true
			}
		}))

		/*
		// Log who our people are
		tasks.addTask('log', function () {
			require('assert-helpers').log(Person.list)
		})
		*/

		// Update them
		tasks.addGroup('save', function (addGroup, addTask) {
			this.setConfig({concurrency: 0})
			Person.list.forEach(function (person) {
				addTask(`Saving: ${person.displayName}`, function (complete) {
					person.save({}, complete)
				})
			})
		})

		// Start
		tasks.run()
	}


	// Check
	const cachely = require('cachely').create({method: fetchPeople, log})

	// Return
	return cachely
}
