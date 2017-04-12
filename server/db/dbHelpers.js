const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const mongoDatabase = require('./index.js');
const User = mongoDatabase.User;
const Call = mongoDatabase.Call;

exports.userEntry = (userInfo) => {
  let newUser = User({
    name: userInfo.name,
    user_id: userInfo.user_id,
    password: userInfo.password,
    phonenumber: userInfo.phonenumber
  });
  return new Promise((resolve, reject) => {
    newUser.save()
    .then((success) => {
      let resolved = `${newUser.name} successfully added`;
      console.log(resolved);
      resolve(resolved);
    })
    .error((err) => {
      reject(err);
    });
  });
};

exports.logEntry = (log) => {
  const userID = log.user_id;

  let logEntry = {
    entry_type: log.entry_type,
    created_at: Date.now(),
    video_url: log.video_url,
    audio_url: log.audio_url,
    text: log.text,
    watson_results: log.watson_results,
    tags: log.tags
  };
  console.log('Received logEntry:', logEntry);

  return new Promise((resolve, reject) => {
    User.findOneAndUpdate({user_id: userID}, {$push: {'entries': logEntry}}, {safe: true, upsert: false, new: true},
      function(err, model) {
        if (err) {
          reject(err);
        } else {
          console.log(`successfully added ${logEntry.userID} entry:`);
          resolve(model);
        }
      });
  });
};

exports.retrieveEntry = (query) => {
  let targetUser = query.user || 'Bob Test';
  return new Promise((resolve, reject) => {
    User.find({ user_id: targetUser })
    .then((results) => {
      if (query.search === undefined) {
        resolve(JSON.stringify(results));
      } else {
        resolve(JSON.stringify(results[0][query.search]));
      }
    })
    .error((err) => {
      reject(err);
    });
  });
};

exports.modifyCall = (callInfo) => {
  let targetUser = callInfo.user_id;
  let newMessage = callInfo.message;
  let time = callInfo.time.replace(':', '');
  let oldTime = '';
  User.find({ user_id: targetUser })
  .then((user) => {
    oldTime = user.scheduled_time;
    user.scheduled_time = time;
    user.scheduled_message = newMessage;
    console.log('Successfully found user', user, 'oldTime:', oldTime);
  })
  .then(() => {
    Call.find({ time: oldTime });
  })
  .then((time) => {
    if (time) {
      console.log('Found time in call:', time);
      time.user.splice(time.user.indexOf(targetUser), 1);
      console.log('Successfuly spliced:', time);
    }
    return;
  })
  .then(() => {
    Call.find({ time: time });
  })
  .then((time) => {
    time.user.push(targetUser);
    console.log('Added user to time:', time);
  })
  .error((err) => {
    console.log('Error occurred within modifyCall to db:', err);
  });

};

exports.callEntry = (callInfo) => {
  let newCall = Call({
    time: callInfo.time,
    user: callInfo.user_id
  });
  return new Promise((resolve, reject) => {
    newCall.save()
    .then(function(success) {
      resolve(console.log(`${callInfo.user_id} scheduled call successfully added`));
    })
    .error(function(err) {
      reject(err);
    });
  });
};

exports.retrieveCall = (query) => {
  let time = query.time;
  Call.find({time: time})
  .populate('schedule', 'name', 'scheduled_message') 
  .exec((err, user) => {
    if (err) {
      return handleError(err);
    } else {
      console.log('Saved users are:', call.schedule.name, 'scheduled message:', call.schedule.scheduled_message);
    }  
  });
};
