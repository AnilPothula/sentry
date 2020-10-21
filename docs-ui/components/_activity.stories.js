import {boolean, color} from '@storybook/addon-knobs';
import {withInfo} from '@storybook/addon-info';

import ActivityAvatar from 'app/components/activity/item/avatar';
import ActivityBubble from 'app/components/activity/item/bubble';
import ActivityItem from 'app/components/activity/item';

const user = {
  username: 'billy@sentry.io',
  identities: [],
  id: '1',
  name: 'billy@sentry.io',
  dateJoined: '2019-03-09T06:52:42.836Z',
  avatar: {avatarUuid: null, avatarType: 'letter_avatar'},
  email: 'billy@sentry.io',
};

export default {
  title: 'Core/_Activity/Item',
};

export const DefaultActivityItem = withInfo(
  'An Activity Item is composed of: an author, header, body, and additionally timestamp and a status.'
)(() => (
  <ActivityItem
    author={{type: 'user', user}}
    item={{id: '123'}}
    date={new Date()}
    header={<div>{user.email}</div>}
    hideDate={boolean('Hide Date', false)}
  >
    Activity Item
  </ActivityItem>
));

DefaultActivityItem.story = {
  name: 'default ActivityItem',
};

export const WithCustomHeader = withInfo('Activity Item with a custom header')(() => (
  <ActivityItem
    author={{type: 'user', user}}
    item={{id: '123'}}
    date={new Date()}
    header={() => (
      <div style={{backgroundColor: '#ccc'}}>Custom header (no timestamp)</div>
    )}
  >
    Activity Item
  </ActivityItem>
));

WithCustomHeader.story = {
  name: 'with custom Header',
};

export const WithFooter = withInfo('Activity Item with a footer')(() => (
  <ActivityItem
    author={{type: 'user', user}}
    item={{id: '123'}}
    date={new Date()}
    hideDate={boolean('Hide Date', false)}
    header={<div>{user.email}</div>}
    footer={<div>Footer</div>}
  >
    Activity Item
  </ActivityItem>
));

WithFooter.story = {
  name: 'with footer',
};

export const SystemActivity = withInfo('An ActivityItem generated by Sentry')(() => (
  <ActivityItem
    author={{type: 'system'}}
    item={{id: '123'}}
    date={new Date()}
    header={<div>Sentry detected something</div>}
    hideDate={boolean('Hide Date', false)}
  >
    Sentry did something
  </ActivityItem>
));

SystemActivity.story = {
  name: 'system activity',
};

export const Bubble = withInfo(
  'Activity bubble with arrow at the top-left. This should probably not be used directly unless creating a new component.'
)(() => (
  <ActivityBubble
    backgroundColor={color('Background', '#fff')}
    borderColor={color('Border', 'red')}
  >
    <div>Activity Bubble</div>
    <div>Activity Bubble</div>
    <div>Activity Bubble</div>
    <div>Activity Bubble</div>
    <div>Activity Bubble</div>
  </ActivityBubble>
));

export const Avatar = withInfo('Avatar based on the author type.')(() => (
  <div>
    <h3>User</h3>
    <ActivityAvatar type="user" user={user} size={48} />

    <h3>System</h3>
    <ActivityAvatar type="system" size={48} />
  </div>
));
