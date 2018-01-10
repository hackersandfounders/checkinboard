angular
  .module('board', [
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

  .controller('BoardController', function($scope, Data, $timeout, $uibModal) {

    $scope.allRooms = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2', '5.1', 'skip'];
    $scope.allRooms.reverse();


    function update() {
      return Data.getBoardState().then(function(state) {
        $scope.state = state; //$scope.$broadcast('boardstate', state);
        return state;
      });
    }

    function reload() {
      update().then(function() {
        if ($scope.running) {
          $timeout(reload, 5000);
        }
      });
    }
    $scope.running = true;
    reload();

    $scope.$on('refresh', update);
    $scope.$on('destroy', function() { $scope.running = false; });


    var currentModal, currentModalTimer;
    function closeModal() {
      $scope.checkoutPersons = false;
      if (currentModal) {
        currentModal.close();
        currentModal = null;
      }
      if (currentModalTimer) {
        $timeout.cancel(currentModalTimer);
      }
      currentModalTimer = null;
    }

    $scope.checkoutPersons = false;

    function showCheckoutDialog(persons) {
      closeModal();
      $scope.checkoutPersons = persons;

      currentModal = $uibModal.open({
        templateUrl: '/views/_checkout_popup.html',
        windowClass: 'checkout-popup',
        scope: $scope,
        controller: function($scope) {
          $scope.close = closeModal;
        }
      });

      currentModal.closed.then(function(r) {
        $scope.checkoutPersons = false;
      });

    };


    $scope.showCheckoutDialog = showCheckoutDialog;

    $scope.showBulkCheckout = function() {
      currentModal = $uibModal.open({
        templateUrl: '/views/_checkout_select_popup.html',
        scope: $scope,
        controller: function($scope) {
          $scope.checkoutPersons = [];
          $scope.isSelected = function(id) {
            return _.indexOf($scope.checkoutPersons.map(function (p) { return p.person.id; }), id) >= 0;
          };

          $scope.go = function() {
            closeModal();
            showCheckoutDialog($scope.checkoutPersons);
          };
          $scope.close = function() {
            $scope.$close();
          };
        }
      });
    };

    $scope.showRoom = function(roomId) {
      if (roomId == 'skip') return;
      currentModal = $uibModal.open({
        templateUrl: '/views/_room_popup.html',
        scope: $scope,
        controller: function($scope) {
          $scope.roomId = roomId;
          $scope.roomInfo = Data.getRoomInfo(roomId);
        }
      });
    };

    var checkin = new Audio(); checkin.src = "sounds/sign_in.mp3"; checkin.load();
    var checkout = new Audio(); checkout.src = "sounds/sign_out.mp3"; checkout.load();

    window.tag = function(tag) {

      if (typeof tag == 'string' && tag.match(/^0F00/i)) {
        // strip 0f00, convert to tag nr
        tag = parseInt(tag.substr(4), 16) >>> 8;
      }

      if ($scope.checkoutPersons) {
        Data.bulkCheckout(tag, _.pluck($scope.checkoutPersons, 'person.id')).then(
          function(r) {
            console.log("OK");
          });

        closeModal();
        update();

        return;
      }

      function showModal(template, cls, controller) {
        closeModal();
        currentModal = $uibModal.open({
          templateUrl: '/views/' + template,
          windowClass: cls,
          scope: $scope,
          controller: controller
        });
      }

      Data.getTagInfo(tag).then(function(r) {
        var tag = r;
        var newState = r.status == 'present' ? 'absent' : 'present';
        Data.updateTagStatus(tag.key, newState).then(function(r) {
          $scope.tag = r;
          $scope.$emit('refresh');

          try {
            if (r.status == 'present') {
              BoardFeedback.playCheckinSound();
            } else {
              BoardFeedback.playCheckoutSound();
            }
          } catch (e) {};

          showModal('_popup_tag_status.html', 'tag-popup', function() {
            currentModalTimer = $timeout(closeModal, 3500);
          });

        }, function(){});
      }, function(e) {
        showModal('_popup_tag_error.html', 'tag-popup', function() {
          currentModalTimer = $timeout(closeModal, 20 * 1000);
          $scope.close = function() {
            closeModal();
          };
        });
      });

    };

  })

  .directive('boardClock', function() {
    return {
      restrict: 'A',
      link: function(scope, elem) {

        function update() {
          elem.html(moment().format("HH:mm"));
        }
        update();
        setInterval(update, 1000);
      }

    };
  })

  ;
