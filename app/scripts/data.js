angular.module('board.data', [])

  .constant('Config', {
    baseUrl: 'http://building.hackersandfounders.nl/api/v1/'
    //baseUrl: 'http://building.10.0.7.158.xip.io/api/v1/'
  })

  .factory('Data', function($http, Config) {

    function getPresenceList() {
      return $http.get(Config.baseUrl + 'presence').then(function(r) {
        return r.data.people;
      });
    }

    function calculateBoardState(people) {
      // filter out unknown people
      people = _.filter(people, function(p) {
        return p.room !== null && p.tags.length > 0; });
      
      // calculate per-person's presence state
      var states = _(people)
        .map(
          function(p) {
            var unsureFlag = false;

            // get most recent tag
            var tag = _(p.tags).sortBy('updated_at').last();
            var ts = moment(tag.updated_at);
            var delta = moment().diff(ts, 'seconds');

            if (delta > 3600*12 && delta < 3600*24*7) {
              unsureFlag = true;
            }
            var checkinState = tag.status == 'present' ? 'in' : 'out';

            return {
              person: p,
              room: p.room,
              date: moment(tag.updated_at).unix(),
              state: checkinState,
              unsure: unsureFlag,
              time: ts.format("HH:mm")
            };
          })
        .sortBy('date')
        .reverse()
        .value();

      var rooms = _(states)
        .groupBy('room')
        .mapValues(function(v) {
          var inCount = _(v).filter({state:'in'}).value().length;
          return {
            total: v.length,
            'in': inCount,
            state: inCount > 0 ? 'inhabited' : 'deserted'
          };
        })
        .value();
      
      var recent = _(states).reject('unsure').slice(0,12).value();
      var unsure = _(states).filter('unsure').map('person').slice(0,8).value();

      return {
        people: {
          'in': _.filter(states, {state: 'in'}).length,
          'out': _.filter(states, {state: 'out'}).length
        },
        rooms: rooms,
        recent: recent,
        unsure: unsure
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
      }
    };
  })

;
