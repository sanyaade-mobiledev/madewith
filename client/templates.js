Template.app_list.apps = function() {
  var order = Session.get('order');
  switch (order) {
  case 'popular':
  case undefined:
    return Apps.find({}, {sort: {vote_count: -1, name: 1}});
    break;

  case 'recent':
    return Apps.find({}, {sort: {when: -1, name: 1}});
    break;

  default:
    throw new Error("Unexpected order: " + order);
  }
};

Template.add_or_draft_app.draft = function() {
  return Session.get('draft');
};

Template.draft_app.events = {
  'keyup #draft_description, keyup #draft_name': function() {
    $('.draft_app_submit').attr('disabled',
                                $('#draft_description').val() === '' ||
                                $('#draft_name').val() === '');
  },
  'click .draft_app_cancel': function() {
    Session.set('draft', false);
  },
  'click .draft_app_submit': function() {
    var name = Madewith.shortAppName(Madewith.removeUrlProtocol($('#draft_name').val()));
    var salt = Meteor.uuid();
    var password = $('#draft_password').val();

    var app = {
      name: name,
      description: $('#draft_description').val(),
      github_url: Madewith.removeUrlProtocol($('#draft_github_url').val()),
      pw_salt: salt,
      pw_sha: Crypto.SHA256(salt + '-' + password)
    };

    Meteor.call('createApp', app, function (err, id) {
      if (!err) {
        Router.setSelectedAppName(name);
        Madewith.animateToSelectedApp();
        Session.set('draft', false);
        Session.set('last_added_app_name', name);
      }
    });
  }
};

Template.app_list.events = {
  'click .add_app': function() {
    Session.set('draft', true);
  }
};

Template.app.events = {
  'click .new_comment': function(event) {
    event.stopPropagation(); // so that we don't collapse the app
  },
  'click .new_comment_submit': function() {
    Meteor.call('comment',
                this._id,
                $('#new_comment_author').val(),
                $('#new_comment_comment').val(),
                function(err, result) {
                  if (!err) {
                    $('#new_comment_author').val('');
                    $('#new_comment_comment').val('');
                  }
                });

    event.stopPropagation(); // so that we don't collapse the app
  },
  'click .upvote': function(event) {
    Meteor.call('vote', this.name);
    Router.setSelectedAppName(this.name);
    event.stopPropagation();
  },
  'click': function() {
    Router.setSelectedAppName(this.name);
  },
  'click .app_description, click .comments_expanded_arrow':
  function(event) {
    if (Session.get('selected_app_name') === this.name) {
      Router.setSelectedAppName(null);
      event.stopPropagation();
    }
  }
};

Template.app.app_additional_class = function() {
  if (Session.equals('selected_app_name', this.name))
    return 'app_selected';
  else
    return '';
};

Template.app.comments_expanded = function() {
  return Session.equals('selected_app_name', this.name);
};

Template.app.normalized_name = function() {
  return Madewith.normalizedAppName(this.name);
};

Template.app.app_domain = function() {
  if (this.name.indexOf('.') === -1)
    return this.name + '.meteor.com';
  else
    return this.name;
};

Template.app_comments.events = {
  'keyup #new_comment_comment': function() {
    $('.new_comment_submit').attr('disabled',
                                  $('#new_comment_comment').val().length < 3);
  }
};

Template.app_comments.comments = function() {
  return Madewith.commentsForApp(this);
};

Template.app_comments.comment_html = function() {
  return Handlebars._escape(this.comment).replace(/\n/g, '<br>');
};

Template.app_comments.comment_author = function() {
  return this.author || 'Anonymous';
};

Template.action_bar.events = {
  'click #sort_toggle_popular': function() {
    Router.setOrder('popular');
  },
  'click #sort_toggle_recent': function() {
    Router.setOrder('recent');
  }
};

Template.action_bar.additional_class = function(order) {
  return Session.get('order') === order ? 'sort_toggle_selected' : '';
};

Template.install_badge_instructions.just_added_app = function() {
  return Session.get('last_added_app_name') === this.name;
};

