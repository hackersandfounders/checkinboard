angular.module('board', [
  'ui.bootstrap',
  'ui.router',

  // compiled templates
  'templates',

  // modules
  'board.data',
])

  .config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

      .state('board', {
        url: "/board",
        controller: 'BoardController',
        templateUrl: "/views/board.html"
      })
    
    ;
    
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/board');

  })

  .controller('BoardController', function($scope, Data, $timeout, $modal) {

    $scope.allRooms = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];
    $scope.allRooms.reverse();
    
    $scope.running = true;
    function reload() {
      Data.getBoardState().then(function(state) {
        $scope.state = state; //$scope.$broadcast('boardstate', state);
      });
      if ($scope.running) {
        $timeout(reload, 5000);
      }
    }
    $scope.$on('refresh', reload);
    $scope.$on('destroy', function() { $scope.running = false; });
    
    reload();

    var tagModal, tagModalTimer;
    function closeModal() {
      if (tagModal) {
        tagModal.close();
        tagModal = null;
      }
      if (tagModalTimer) {
        $timeout.cancel(tagModalTimer);
      }
      tagModalTimer = null;
    }

    var checkin = new Audio(); checkin.src = "sounds/sign_in.mp3"; checkin.load();
    var checkout = new Audio(); checkout.src = "sounds/sign_out.mp3"; checkout.load();
    
    window.tag = function(tag) {
      
      if (typeof tag == 'string' && tag.match(/^0F00/i)) {
        // strip 0f00, convert to tag nr
        tag = parseInt(tag.substr(4), 16) >>> 8;
      }
      closeModal();
      tagModal = $modal.open({
        templateUrl: '/views/_tag_popup.html',
        windowClass: 'tag-popup',
        scope: $scope,
        controller: function($scope) {
          $scope.busy = true;

          Data.getTagInfo(tag).then(function(r) {
            $scope.tag = r;

            var newState = r.status == 'present' ? 'absent' : 'present';
            Data.updateTagStatus(tag, newState).then(function(r) {
              $scope.tag = r;
              $scope.busy = false;
              $scope.$emit('refresh');

              
              if (r.status == 'present') {
                BoardFeedback.playCheckinSound();
              } else {
                BoardFeedback.playCheckoutSound();
              }
              
              tagModalTimer = $timeout(closeModal, 3500);
            }, function(){});
            
          });
        }
      });
    };
    
  })

;
