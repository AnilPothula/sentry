from sentry.models import (
    Identity,
    IdentityProvider,
    IdentityStatus,
    Integration,
    NotificationSetting,
    OrganizationIntegration,
)
from sentry.notifications.helpers import _get_notification_setting_default
from sentry.notifications.types import NotificationSettingOptionValues, NotificationSettingTypes
from sentry.testutils import APITestCase
from sentry.types.integrations import ExternalProviders


class SlackUninstallTest(APITestCase):
    """TODO(mgaeta): Extract the endpoint's DELETE logic to a helper and use it instead of  API."""

    endpoint = "sentry-api-0-organization-integration-details"
    method = "delete"

    def setUp(self) -> None:
        self.integration = Integration.objects.create(
            provider="slack",
            name="Team A",
            external_id="TXXXXXXX1",
            metadata={
                "access_token": "xoxp-xxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx",
                "installation_type": "born_as_bot",
            },
        )
        self.integration.add_organization(self.organization)

        self.idp = IdentityProvider.objects.create(type="slack", external_id="TXXXXXXX1", config={})
        self.identity = Identity.objects.create(
            external_id="UXXXXXXX1",
            idp=self.idp,
            user=self.user,
            status=IdentityStatus.VALID,
            scopes=[],
        )
        self.login_as(self.user)

    def uninstall(self) -> None:
        assert OrganizationIntegration.objects.filter(
            integration=self.integration, organization=self.organization
        ).exists()

        with self.tasks():
            self.get_success_response(self.organization.slug, self.integration.id)

        assert Integration.objects.filter(id=self.integration.id).exists()

        assert not OrganizationIntegration.objects.filter(
            integration=self.integration, organization=self.organization
        ).exists()

    def get_notification(self, provider: ExternalProviders) -> NotificationSettingOptionValues:
        type = NotificationSettingTypes.ISSUE_ALERTS
        value = NotificationSetting.objects.get_settings(provider, type, user=self.user)
        if value != NotificationSettingOptionValues.DEFAULT:
            return value
        return _get_notification_setting_default(provider, type)

    def set_notification(
        self, provider: ExternalProviders, value: NotificationSettingOptionValues
    ) -> None:
        type = NotificationSettingTypes.ISSUE_ALERTS
        NotificationSetting.objects.update_settings(provider, type, value, user=self.user)

    def test_uninstall_email_only(self):
        self.uninstall()

        assert (
            self.get_notification(ExternalProviders.EMAIL) == NotificationSettingOptionValues.ALWAYS
        )
        assert (
            self.get_notification(ExternalProviders.SLACK) == NotificationSettingOptionValues.NEVER
        )

    def test_uninstall_slack_and_email(self):
        self.set_notification(ExternalProviders.SLACK, NotificationSettingOptionValues.ALWAYS)

        self.uninstall()

        assert (
            self.get_notification(ExternalProviders.EMAIL) == NotificationSettingOptionValues.ALWAYS
        )
        assert (
            self.get_notification(ExternalProviders.SLACK) == NotificationSettingOptionValues.NEVER
        )

    def test_uninstall_slack_only(self):
        self.set_notification(ExternalProviders.EMAIL, NotificationSettingOptionValues.NEVER)
        self.set_notification(ExternalProviders.SLACK, NotificationSettingOptionValues.ALWAYS)

        self.uninstall()

        assert (
            self.get_notification(ExternalProviders.EMAIL) == NotificationSettingOptionValues.NEVER
        )
        assert (
            self.get_notification(ExternalProviders.SLACK) == NotificationSettingOptionValues.NEVER
        )
