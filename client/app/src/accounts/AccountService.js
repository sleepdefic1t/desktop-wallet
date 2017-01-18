(function(){
  'use strict';

  angular.module('arkclient')
         .service('accountService', ['$q', '$http', 'networkService', 'storageService', 'gettextCatalog', AccountService]);

  /**
   * Accounts DataService
   * Uses embedded, hard-coded data model; acts asynchronously to simulate
   * remote data service call(s).
   *
   * @returns {{loadAll: Function}}
   * @constructor
   */
  function AccountService($q, $http, networkService, storageService, gettextCatalog){

    var ark=require('arkjs');

    var TxTypes = {
      0:"Send Ark",
      1:"Second Signature Creation",
      2:"Delegate Registration",
      3:"Vote",
      4:"Multisignature Creation"
    };

    var peer=networkService.getPeer().ip;

    function showTimestamp(time){
      var d = new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0));
      var t = parseInt(d.getTime() / 1000);

      time = new Date((time + t) * 1000);

      var currentTime = new Date().getTime();
      var diffTime = (currentTime - time.getTime()) / 1000;

      if (diffTime < 60) {
          return Math.floor(diffTime) + ' sec ago';
      }
      if (Math.floor(diffTime / 60) <= 1) {
          return Math.floor(diffTime / 60) + ' min ago';
      }
      if ((diffTime / 60) < 60) {
          return Math.floor(diffTime / 60) + ' mins ago';
      }
      if (Math.floor(diffTime / 60 / 60) <= 1) {
          return Math.floor(diffTime / 60 / 60) + ' hour ago';
      }
      if ((diffTime / 60 / 60) < 24) {
          return Math.floor(diffTime / 60 / 60) + ' hours ago';
      }
      if (Math.floor(diffTime / 60 / 60 / 24) <= 1) {
          return Math.floor(diffTime / 60 / 60 / 24) + ' day ago';
      }
      if ((diffTime / 60 / 60 / 24) < 30) {
          return Math.floor(diffTime / 60 / 60 / 24) + ' days ago';
      }
      if (Math.floor(diffTime / 60 / 60 / 24 / 30) <= 1) {
          return Math.floor(diffTime / 60 / 60 / 24 / 30) + ' month ago';
      }
      if ((diffTime / 60 / 60 / 24 / 30) < 12) {
          return Math.floor(diffTime / 60 / 60 / 24 / 30) + ' months ago';
      }
      if (Math.floor((diffTime / 60 / 60 / 24 / 30 / 12)) <= 1) {
          return Math.floor(diffTime / 60 / 60 / 24 / 30 / 12) + ' year ago';
      }

      return Math.floor(diffTime / 60 / 60 / 24 / 30 / 12) + ' years ago';
    };

    function fetchAccount(address){
      var deferred = $q.defer();
      networkService.getFromPeer('/api/accounts?address='+address).then(
        function (resp) {
          if(resp.success){
            var account=resp.account;
            account.cold=!account.publicKey;
            deferred.resolve(account);
            addAccount(account);
          }
          else{
            account={
              address:address,
              balance:0,
              secondSignature:false,
              cold:true
            };
            deferred.resolve(account);
            addAccount(account);
          }
        }
      );
      return deferred.promise;
    };

    function fetchAccountAndForget(address){
      var deferred = $q.defer();
      networkService.getFromPeer('/api/accounts?address='+address).then(
        function (resp) {
          if(resp.success){
            var account=resp.account;
            account.cold=!account.publicKey;
            deferred.resolve(account);
          }
          else{
            account={
              address:address,
              balance:0,
              secondSignature:false,
              cold:true
            };
            deferred.resolve(account);
          }
        }
      );
      return deferred.promise;
    };

    function getAccount(address){
      var account=storageService.get(address);
      if(account){
        account.transactions=storageService.get("transactions-"+address);
        account.username=storageService.get("username-"+address);
        account.delegate=storageService.get("delegate-"+address);
        account.virtual=getVirtual(address);
        return account;
      }
      else{
        return null;
      }
    }

    function createAccount(passphrase){
      var deferred = $q.defer();
      var address=ark.crypto.getAddress(ark.crypto.getKeys(passphrase).publicKey);
      var account=fetchAccount(address).then(function(account){
        if(account){
          account.virtual=account.virtual || {};
          storageService.set("virtual-"+address,account.virtual);
          deferred.resolve(account);
        }
        else{
          deferred.reject(gettextCatalog.getString("Passphrase does not match your address"));
        }
      });
      return deferred.promise;
    }

    function savePassphrases(address, passphrase, secondpassphrase){
      var deferred = $q.defer();
      var tempaddress = ark.crypto.getAddress(ark.crypto.getKeys(passphrase).publicKey);
      if(passphrase){
        var account=fetchAccount(tempaddress).then(function(account){
          if(account.address == address){
            account.virtual=account.virtual || {};
            storageService.set("virtual-"+address,account.virtual);
            storageService.set("passphrase-"+address,passphrase);
            storageService.set("secondpassphrase-"+address,secondpassphrase);
            deferred.resolve(account);
          }
          else{
            deferred.reject(gettextCatalog.getString("Passphrase does not match your address"));
          }
        });
      }
      else{ // no passphrase, meaning remove all passphrases
        storageService.set("virtual-"+address,null);
        storageService.set("passphrase-"+address,null);
        storageService.set("secondpassphrase-"+address,null);
        deferred.reject(gettextCatalog.getString("Passphrases deleted"));
      }

      return deferred.promise;
    }

    function getPassphrases(address){
      var passphrases = [storageService.get("passphrase-"+address),storageService.get("secondpassphrase-"+address)]
      return passphrases;
    }

    function addAccount(account){
      if(!account || !account.address){
        return;
      }
      storageService.set(account.address,account);
      var addresses=storageService.get("addresses");
      if(!addresses){
        addresses=[];
      }
      if(addresses.indexOf(account.address)==-1){
        addresses.push(account.address);
        storageService.set("addresses",addresses);
      }
    };

    function deleteAccount(account){
      if(!account || !account.address){
        return $q.when(null);
      }
      //delete account data
      storageService.set(account.address,null)
      storageService.set("transactions-"+account.address,null);
      storageService.set("voters-"+account.address,null);
      storageService.set("username-"+account.address,null);
      storageService.set("virtual-"+account.address,null);
      storageService.set("passphrase-"+account.address,null);
      storageService.set("secondpassphrase-"+account.address,null);

      //remove the address from stored addresses
      var addresses=storageService.get("addresses");
      addresses.splice(addresses.indexOf(account.address),1);
      storageService.set("addresses",addresses);
      return $q.when(account);
    };

    function getTransactions(address, offset, limit) {
      if(!offset){
        offset=0;
      }
      if(!limit){
        limit=100
      }
      var deferred = $q.defer();
      var d = new Date(Date.UTC(2016, 4, 24, 17, 0, 0, 0));
      var t = parseInt(d.getTime() / 1000);
      networkService.getFromPeer("/api/transactions?orderBy=timestamp:desc&limit="+limit+"&recipientId=" +address +"&senderId="+address).then(function (resp) {
        if(resp.success){
          for(var i=0;i<resp.transactions.length;i++){
            var transaction = resp.transactions[i];
            transaction.label=gettextCatalog.getString(TxTypes[transaction.type]);
            transaction.date=new Date((transaction.timestamp + t) * 1000);
            if(transaction.recipientId==address){
              transaction.total=transaction.amount;
              if(transaction.type==0){
                transaction.label=gettextCatalog.getString("Receive Ark");
              }
            }
            if(transaction.senderId==address){
              transaction.total=-transaction.amount-transaction.fee;
            }
          }
          storageService.set("transactions-"+address,resp.transactions);
          deferred.resolve(resp.transactions);
        }
        else{
          deferred.reject(gettextCatalog.getString("Cannot get transactions"));
        }
      });
      return deferred.promise;
    };

    function getDelegate(publicKey){
      var deferred = $q.defer();
      if(!publicKey){
        deferred.reject(gettextCatalog.getString("No publicKey"));
        return deferred.promise;
      }
      networkService.getFromPeer("/api/delegates/get/?publicKey="+publicKey).then(function (resp) {
        if(resp && resp.success && resp.delegate){
          storageService.set("delegate-"+resp.delegate.address,resp.delegate);
          storageService.set("username-"+resp.delegate.address,resp.delegate.username);
          deferred.resolve(resp.delegate);
        }
        else{
          deferred.reject(gettextCatalog.getString("Cannot state if account is a delegate"));
        }
      });
      return deferred.promise;
    };

    function getDelegateByUsername(username){
      var deferred = $q.defer();
      if(!username){
        deferred.reject("No Username");
        return deferred.promise;
      }
      networkService.getFromPeer("/api/delegates/get/?username="+username).then(function (resp) {
        if(resp && resp.success && resp.delegate){
          storageService.set("delegate-"+resp.delegate.address,resp.delegate);
          storageService.set("username-"+resp.delegate.address,resp.delegate.username);
          deferred.resolve(resp.delegate);
        }
        else{
          deferred.reject(gettextCatalog.getString("Cannot find delegate: ")+ username);
        }
      });
      return deferred.promise;
    };

    //TODO: NOT working yet, waiting for 0.3.2
    function searchDelegates(term){
      var deferred = $q.defer();
      if(!term){
        deferred.reject(gettextCatalog.getString("No search term"));
        return deferred.promise;
      }
      networkService.getFromPeer("/api/delegates/search/?term="+term).then(function (resp) {
        if(resp && resp.success && resp.delegates){
          deferred.resolve(resp.delegates);
        }
        else{
          deferred.reject(gettextCatalog.getString("Cannot find delegates from this term: ")+term);
        }
      }, function(err){
        deferred.reject(gettextCatalog.getString("Cannot find delegates on this peer: ")+err);
      });
      return deferred.promise;
    };

    function getVotedDelegates(address){
      var deferred = $q.defer();
      networkService.getFromPeer("/api/accounts/delegates/?address="+address).then(function(resp){
        if(resp && resp.success){
          storageService.set("voted-"+address,resp.delegates);
          deferred.resolve(resp.delegates);
        }
        else{
          deferred.reject(gettextCatalog.getString("Cannot get voted delegates"));
        }
      });
      return deferred.promise;
    };

    function createTransaction(type,config){
      var deferred = $q.defer();
      if(type==0){ //send ark
        var isAddress = /^[1-9A-Za-z]+$/g;
        if(!isAddress.test(config.toAddress)){
          deferred.reject(gettextCatalog.getString("The destination address ")+config.toAddress+gettextCatalog.getString(" is erroneous"));
          return deferred.promise;
        }

        var account=getAccount(config.fromAddress);
        if(config.amount+10000000>account.balance){
          deferred.reject(gettextCatalog.getString("Not enough ARK on your account ")+config.fromAddress);
          return deferred.promise;
        }

        try{
          var transaction=ark.transaction.createTransaction(config.toAddress, config.amount, config.smartbridge, config.masterpassphrase, config.secondpassphrase);
        }
        catch(e){
          deferred.reject(e);
          return deferred.promise;
        }

        if(ark.crypto.getAddress(transaction.senderPublicKey)!=config.fromAddress){
          deferred.reject(gettextCatalog.getString("Passphrase is not corresponding to account ")+config.fromAddress);
          return deferred.promise;
        }

        transaction.senderId=config.fromAddress;
        deferred.resolve(transaction);
      }

      else if(type==2){ //delegate creation
        var account=getAccount(config.fromAddress);
        if(account.balance<2500000000){
          deferred.reject(gettextCatalog.getString("Not enough ARK on your account ")+config.fromAddress+", "+gettextCatalog.getString("you need at least 25 ARK to register delegate"));
          return deferred.promise;
        }
        try{
          var transaction=ark.delegate.createDelegate(config.masterpassphrase, config.username, config.secondpassphrase);
        }
        catch(e){
          deferred.reject(e);
          return deferred.promise;
        }
        if(ark.crypto.getAddress(transaction.senderPublicKey)!=config.fromAddress){
          deferred.reject(gettextCatalog.getString("Passphrase is not corresponding to account ")+config.fromAddress);
          return deferred.promise;
        }
        transaction.senderId=config.fromAddress;
        deferred.resolve(transaction);
      }

      else if(type==3){ //vote
        var account=getAccount(config.fromAddress);
        if(account.balance<100000000){
          deferred.reject(gettextCatalog.getString("Not enough ARK on your account ")+config.fromAddress+", "+gettextCatalog.getString("you need at least 1 ARK to vote"));
          return deferred.promise;
        }
        try{
          var transaction=ark.vote.createVote(config.masterpassphrase, config.publicKeys.split(","), config.secondpassphrase);
        }
        catch(e){
          deferred.reject(e);
          return deferred.promise;
        }
        if(ark.crypto.getAddress(transaction.senderPublicKey)!=config.fromAddress){
          deferred.reject(gettextCatalog.getString("Passphrase is not corresponding to account ")+config.fromAddress);
          return deferred.promise;
        }
        transaction.senderId=config.fromAddress;
        deferred.resolve(transaction);
      }
      return deferred.promise;
    };

    // Given a final list of delegates, create a vote assets list to be sent
    // return null if could not make it
    function createDiffVote(address, newdelegates){

      function arrayObjectIndexOf(myArray, searchTerm, property) {
        for(var i = 0, len = myArray.length; i < len; i++) {
          if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
      }

      var assets = [];
      var votedDelegates = storageService.get("voted-"+address) || [];
      votedDelegates = votedDelegates.map(function(delegate){
        return {
          username: delegate.username,
          address: delegate.address,
          publicKey: delegate.publicKey
        };
      });

      var delegates = newdelegates.map(function(delegate){
        return {
          username: delegate.username,
          address: delegate.address,
          publicKey: delegate.publicKey
        };
      });

      if(delegates.length>101){
        return null;
      }
      var difflist=[];
      var notRemovedDelegates=[];
      for(var i in delegates){
        var delegate = delegates[i];
        if(arrayObjectIndexOf(votedDelegates,delegate.publicKey,"publicKey") == -1){
          delegate.vote="+"
          difflist.push(delegate);
        }
        else {
          notRemovedDelegates.push(delegate);
        }
        if(difflist.length == 33){
          assets.push(difflist);
          difflist = [];
        }
      }
      for(var i in votedDelegates){
        var delegate = votedDelegates[i];
        if(arrayObjectIndexOf(notRemovedDelegates,delegate.publicKey,"publicKey") == -1){
          delegate.vote="-"
          difflist.push(delegate);
        }
        if(difflist.length == 33){
          assets.push(difflist);
          difflist = [];
        }
      }
      if(difflist.length > 0){
        assets.push(difflist);
      }
      console.log(assets);
      return assets;
    };

    function getSponsors(){
      var deferred = $q.defer();
      var result=[];
      $http.get("https://gist.githubusercontent.com/fix/a7b1d797be38b0591e725a24e6735996/raw/sponsors.json").then(function (resp) {
        var count=0;
        for(var i in resp.data){
          networkService.getFromPeer("/api/delegates/get/?publicKey="+resp.data[i].publicKey).then(function (resp2) {
            if(resp2.data && resp2.data.success && resp2.data.delegate){
              result.push(resp2.data.delegate);
            }
            count++;
            if(count==resp.data.length-1){
              deferred.resolve(result);
            }
          },
          function(error){
            count++;
          });
        }
      },function(err){
        console.log(err);
        deferred.reject(gettextCatalog.getString("Cannot get sponsors"));
      });
      return deferred.promise;
    };

    function createVirtual(passphrase){
      var deferred = $q.defer();
      var address=ark.crypto.getAddress(ark.crypto.getKeys(passphrase).publicKey);
      var account=getAccount(address);
      if(account){
        account.virtual=account.virtual || {};
        storageService.set("virtual-"+address,account.virtual);
        deferred.resolve(account.virtual);
      }
      else{
        deferred.reject(gettextCatalog.getString("Passphrase does not match your address"));
      }

      return deferred.promise;
    };

    function setToFolder(address, folder, amount){
      var virtual=getVirtual(address);
      console.log(virtual);
      var f=virtual[folder];
      if(f && amount>=0){
        f.amount=amount;
      }
      else if(!f && amount>=0){
        virtual[folder]={amount:amount};
      }
      storageService.set("virtual-"+address,virtual);
      return getVirtual(address);
    };

    function deleteFolder(address, folder){
      var virtual=storageService.get("virtual-"+address);
      delete virtual[folder];
      storageService.set("virtual-"+address,virtual);
      return getVirtual(address);
    };

    function getVirtual(address){
      var virtual=storageService.get("virtual-"+address);
      if(virtual){
        virtual.uservalue=function(folder){
          return function(value){
            if(virtual[folder]){
              if(arguments.length==1){
                if(value===null){
                  return virtual[folder].amount=null;
                }
                else{
                  return virtual[folder].amount=value*100000000;
                }
              }
              else{
                return virtual[folder].amount===null?"":virtual[folder].amount/100000000;
              }
            }
          }
        };
        virtual.getFolders=function(){
          var folders=[];
          for (var i in virtual){
            if (virtual.hasOwnProperty(i) && typeof virtual[i] != 'function') {
              folders.push(i);
            }
          }
          return folders;
        }
      }
      return virtual;
    }


    return {
      loadAllAccounts : function() {
        var accounts = storageService.get("addresses");
        if(!accounts){
          return [];
        }
        var uniqueaccounts=[];
        for(var i in accounts){
          if(uniqueaccounts.indexOf(accounts[i])==-1){
            uniqueaccounts.push(accounts[i]);
          }
        }
        accounts=uniqueaccounts;
        console.log(uniqueaccounts);
        accounts=accounts.filter(function(address){
          return (storageService.get("username-"+address)!=null || storageService.get("virtual-"+address)!=null);
        });
        return accounts.map(function(address){
          var account=storageService.get(address);
          if(account){
            account.transactions=storageService.get("transactions-"+address);
            account.delegate=storageService.get("delegate-"+address);
            account.username=storageService.get("username-"+address);
            account.virtual=getVirtual(address);
            return account;
          }
          return {address:address}
        });
      },

      getAccount: getAccount,

      refreshAccount: function(account){
        return fetchAccount(account.address);
      },

      setUsername: function(address,username){
        storageService.set("username-"+address,username);
      },

      getUsername: function(address){
        return storageService.get("username-"+address) || address;
      },

      addAccount: addAccount,

      createAccount: createAccount,

      savePassphrases: savePassphrases,

      getPassphrases: getPassphrases,

      deleteAccount: deleteAccount,

      fetchAccount: fetchAccount,

      fetchAccountAndForget: fetchAccountAndForget,

      getTransactions: getTransactions,

      createTransaction: createTransaction,

      createDiffVote: createDiffVote,

      getVotedDelegates: getVotedDelegates,

      getDelegate: getDelegate,

      getDelegateByUsername: getDelegateByUsername,

      getSponsors: getSponsors,

      createVirtual: createVirtual,

      setToFolder: setToFolder,

      deleteFolder: deleteFolder
    }
  }

})();
