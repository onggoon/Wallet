'use strict';
angular.module('copayApp.controllers').controller('tourController',
  function($scope, $state, $log, $timeout, $filter, ongoingProcess, profileService, rateService, popupService, gettextCatalog, startupService, storageService) {

    $scope.data = {
      index: 0
    };

    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.createProfile = function() {
      $log.debug('Creating profile');
      profileService.createProfile(function(err) {
        if (err) $log.warn(err);
      });
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      rateService.whenAvailable(function() {
        var localCurrency = 'USD';
        var btcAmount = 1;
        var rate = rateService.toFiat(btcAmount * 1e8, localCurrency, 'btc');
        $scope.localCurrencySymbol = '$';
        $scope.localCurrencyPerBtc = $filter('formatFiatAmount')(parseFloat(rate.toFixed(2), 10));
        $timeout(function() {
          $scope.$apply();
        })
      });
    });

    var retryCount = 0;
    $scope.createDefaultWallet = function() {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {
        profileService.createDefaultWallet(function(err, walletClients) {
          if (err) {
            $log.warn(err);

            return $timeout(function() {
              $log.warn('Retrying to create default wallet.....:' + ++retryCount);
              if (retryCount > 3) {
                ongoingProcess.set('creatingWallet', false);
                popupService.showAlert(
                  gettextCatalog.getString('Cannot Create Wallet'), err,
                  function() {
                    retryCount = 0;
                    return $scope.createDefaultWallet();
                  }, gettextCatalog.getString('Retry'));
              } else {
                return $scope.createDefaultWallet();
              }
            }, 2000);
          };
          ongoingProcess.set('creatingWallet', false);
          var bchWallet = walletClients[0];
          var btcWallet = walletClients[1];

          var bchWalletId = bchWallet.credentials.walletId;
          var btcWalletId = btcWallet.credentials.walletId;

          $state.go('onboarding.collectEmail', {
            bchWalletId: bchWalletId,
            btcWalletId: btcWalletId
          });
        });
      }, 300);
    };
  });
