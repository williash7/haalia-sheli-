  firebase.initializeApp({
    apiKey:"AIzaSyCHUX7WVHDxrB3qXW7fQUNLW3WrbaUVhCE",
    authDomain:"haalia-sheli.firebaseapp.com",
    projectId:"haalia-sheli",
    storageBucket:"haalia-sheli.firebasestorage.app",
    messagingSenderId:"926673047507",
    appId:"1:926673047507:web:4db42ceea6972827c52926"
  });
  var _auth = firebase.auth();
  var _db   = firebase.firestore();

  window._fbSignIn = function(){
    _auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(function(err){
        if(err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user"){
          _auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
        }
      });
  };
  window._fbSignOut = function(){ _auth.signOut(); };
  // Handle redirect fallback
  _auth.getRedirectResult().catch(function(){});
  window._fbSave = async function(uid, data){
    try{ await _db.collection("users").doc(uid).set({state: JSON.stringify(data)}); }
    catch(e){ console.warn("fbSave:", e); }
  };
  window._fbLoad = async function(uid){
    try{
      var snap = await _db.collection("users").doc(uid).get();
      if(snap.exists) return JSON.parse(snap.data().state);
    }catch(e){ console.warn("fbLoad:", e); }
    return null;
  };

  async function _doSync(user){
    var waited=0;
    while((!window._getS||!window._setS)&&waited<5000){
      await new Promise(r=>setTimeout(r,100)); waited+=100;
    }
    if(!window._getS||!window._setS)return;
    // Sync app state
    var cloud=await window._fbLoad(user.uid);
    if(cloud){
      var local=window._getS();
      var cLen=(cloud.history||[]).length;
      var lLen=(local.history||[]).length;
      if(cLen>=lLen){window._setS(cloud);}
      else{window._fbSave(user.uid,local);}
    }else{
      window._fbSave(user.uid,window._getS());
    }
  }

  _auth.onAuthStateChanged(async function(user){
    window._fbUser=user||null;
    if(user) _doSync(user);
    if(window._updateAuthUI) window._updateAuthUI();
  });