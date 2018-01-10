angular.module('board.data', [])

  .constant('Config', {
    baseUrl: '//board-api.hackersandfounders.nl/api/v1/'
  })

  .factory('Data', function($http, Config) {

    var lastPresence;
    function getPresenceList() {
      return $http.get(Config.baseUrl + 'presence').then(function(r) {
        lastPresence = r.data;
        return lastPresence;
      });
    }

    function calculateBoardState(presence) {

      // filter out unknown people
      people = _.filter(presence.people, function(p) {
        return p.room !== null && p.tags.length > 0; });

      // calculate per-person's presence state
      var states = _(people)
        .map(
          function(p) {
            // get most recent tag
            var tag = _(p.tags).sortBy('updated_at').last();
            var ts = moment(tag.updated_at);
            var checkinState = tag.status == 'present' ? 'in' : 'out';

            return {
              person: p,
              room: p.room,
              date: moment(tag.updated_at).unix(),
              state: checkinState,
              time: ts.format("HH:mm")
            };
          })
        .sortBy('date')
        .reverse()
        .value();

      var rooms = _(states)
        .groupBy('room')
        .mapValues(function(v) {
          var people = _(v).filter({state:'in'}).value();
          var inCount = people.length;
          return {
            total: v.length,
            people: people,
            'in': inCount,
            state: inCount > 0 ? 'inhabited' : 'deserted'
          };
        })
        .value();

      var actionStates = {"check_in": "in", "check_out": "out"};
      var recent = _(presence.actions).slice(0,20).map(function(p) {
        p.state = actionStates[p.type];
        p.time = moment(p.at).format("HH:mm");
        p.name = p.owner.name || 'Unregistered';
        return p;
      }).value();

      var unsure = _(states).filter('unsure').map('person').slice(0,8).value();

      return {
        people: {
          'in': _.filter(states, {state: 'in'}).length,
          'out': _.filter(states, {state: 'out'}).length
        },
        rooms: rooms,
        recent: recent
      };
    }

    return {
      getPresenceList: getPresenceList,
      getBoardState: function() {
        return getPresenceList().then(function(people) {
          return calculateBoardState(people);
        });
      },
      getTagInfo: function(tag) {
        return $http.get(Config.baseUrl + 'tags/' + tag).then(function(r) {
          return r.data.tag;
        });
      },
      updateTagStatus: function(tag, status) {
        return $http.patch(Config.baseUrl + 'tags/' + tag, {status: status}).then(function(r) {
          return r.data.tag;
        });
      },

      getRoomInfo: function(roomId) {
        return calculateBoardState(lastPresence).rooms[roomId];
      },

      bulkCheckout: function(tag, personIds) {
        return $http.post(Config.baseUrl + 'bulk_check_outs', {bulk_check_out: {authorized_by: tag, people_ids: personIds}});
      }

    };
  })

;
