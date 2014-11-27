angular.module('ion-freebase-autocomplete', ['freebase'])
  .directive('ionFreebaseAutocomplete', [
    '$ionicTemplateLoader',
    '$ionicBackdrop',
    '$q',
    '$timeout',
    '$rootScope',
    '$document',
    'freebase',
    function($ionicTemplateLoader, $ionicBackdrop, $q, $timeout, $rootScope,
      $document, freebase) {
      return {
        scope: {
          hit: '=',
          searchFilter: '=',
          searchOperator: '@',
          onSelectHit: '&?'
        },
        link: function(scope, element, attrs) {
          scope.hits = [];
          var searchEventTimeout;

          var POPUP_TPL = [
            '<div class="ion-freebase-autocomplete-container">',
              '<div class="bar bar-header item-input-inset">',
                '<label class="item-input-wrapper">',
                  '<i class="icon ion-ios7-search placeholder-icon"></i>',
                  '<input class="freebase-search" type="search" ng-model="searchQuery" placeholder="',
                    attrs.placeholder || 'Enter a query',
                  '" />',
                '</label>',
                '<button class="button button-clear icon ion-ios7-close-outline"></button>',
              '</div>',
              '<ion-content class="has-header has-header">',
                '<ion-list>',
                  '<ion-item ng-repeat="hit in hits" type="item-text-wrap" ng-click="selectHit(hit)">',
                    '{{hit.name}}',
                  '</ion-item>',
                '</ion-list>',
              '</ion-content>',
            '</div>'
          ].join('');

          var popupPromise = $ionicTemplateLoader.compile({
            template: POPUP_TPL,
            scope: scope,
            appendTo: $document[0].body
          });

          scope.selectHit = function(hit) {
            scope.hit = hit;
            if (scope.onSelectHit) {
              scope.onSelectHit({selectedHit: hit});
            }
            scope.modal.element.css('display', 'none');
            $ionicBackdrop.release();
          };

          // prepare search filter from attrs
          var filter = '(' + scope.searchOperator;
          angular.forEach(scope.searchFilter, function(v, k) {
            if (angular.isDefined(v)) {
              filter += ' ' + k + ':"' + v + '"';
            }
          });
          filter += ')';

          // watch query and query freebase
          scope.$watch('searchQuery', function(query) {
            if (searchEventTimeout) $timeout.cancel(
              searchEventTimeout);
            searchEventTimeout = $timeout(function() {
              if (!query) return;
              if (query.length < 3);
              // build the filter from attrs
              freebase.search(query, {filter: filter}).then(function(response) {
                scope.hits = response.data.result;
              });
            }, 350); // we're throttling the input by 350ms to be nice to google's API
          });

          popupPromise.then(function(el) {
            scope.modal = el;
            var searchInputElement = angular.element(el.element.find(
              'input'));

            var onClick = function(e) {
              e.preventDefault();
              e.stopPropagation();
              $ionicBackdrop.retain();
              el.element.css('display', 'block');
              searchInputElement[0].focus();
              setTimeout(function() {
                searchInputElement[0].focus();
              }, 0);
            };

            var onCancel = function(e) {
              scope.searchQuery = '';
              $ionicBackdrop.release();
              el.element.css('display', 'none');
            };

            element.bind('click', onClick);
            element.bind('touchend', onClick);

            el.element.find('button').bind('click', onCancel);
          });

          if (attrs.placeholder) {
            element.attr('placeholder', attrs.placeholder);
          }

        }
      };
    }
  ]);
