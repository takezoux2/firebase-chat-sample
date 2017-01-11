angular.module('starter.controllers', ["starter.configs"])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, CONFIG, $ionicPopup) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // 初期化
  firebase.initializeApp(CONFIG);

  // 認証情報を取得
  // ログインした場合にもこれが実行される
  firebase.auth().onAuthStateChanged(function(user) {
    console.log(user);
    if (user) {
      $scope.username = user.email;
    } else {
      $scope.username = "未ログイン";
    }
  });


  // Form data for the login modal
  $scope.loginData = {};
  // チャットで送信するデータ
  $scope.sendData = {};
  // チャットのメッセージのリスト
  $scope.messages = [];



  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    // 本当は、アカウント作成と、再ログインに分けたほうが良い
    // アカウントの作成
    var loginData = $scope.loginData;
    firebase.auth().createUserWithEmailAndPassword(loginData.username, loginData.password).then(function(success) {
      console.log("Success to login")
      $scope.closeLogin();
    },function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode + ":" + errorMessage);

      // すでにアカウントが存在している
      if(errorCode == "auth/email-already-in-use"){
        // その場合は、ログインする
        firebase.auth().signInWithEmailAndPassword(loginData.username, loginData.password).then(function(success){
          console.log("Success to login")
          $scope.closeLogin();
        }, function(error) {
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(errorCode + ":" + errorMessage);
          $ionicPopup.alert({
            title: 'ログイン失敗',
            template: errorCode + ":" + errorMessage
          });

        });
      }else{
        $ionicPopup.alert({
          title: 'ログイン失敗',
          template: errorCode + ":" + errorMessage
        });
      }
    });
  };

  // チャットの文章を送るメソッド
  $scope.sendMessage = function() {
    if($scope.sendData.text.length == 0){
      return;
    }
    console.log("Send message:" + $scope.sendData.text);
    // pushは、リストに対して要素を追加するためのKeyを取得する
    var key = firebase.database().ref("chat/messages").push().key;
    // 生成したKeyを使用して、要素の追加をする
    firebase.database().ref("chat/messages/" + key).set({
      user: $scope.username,
      text: $scope.sendData.text
    });
    // 入力した文章をリセット
    $scope.sendData.text = "";

  };

  // データベースの変更を検知する
  // データが更新されるたびに呼び出される
  firebase.database().ref("chat/messages").limitToLast(10).on("child_added",function(snapshot){
    // 表示するコメントリストの末尾に追加
    $scope.messages.push(snapshot.val());
    // AngularJSに対して、画面の更新を通知する
    $scope.$applyAsync();
  });

})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
