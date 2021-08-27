from typing import Optional

from sentry.models import (
    Identity,
    IdentityProvider,
    IdentityStatus,
    Integration,
    NotificationSetting,
    Organization,
    OrganizationIntegration,
    Project,
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
        self.integration = self.create_integration(self.organization, "TXXXXXXX1")
        self.login_as(self.user)

    def create_integration(self, organization: Organization, external_id: str):
        integration = Integration.objects.create(
            provider="slack",
            name="Team A",
            external_id=external_id,
            metadata={
                "access_token": "xoxp-xxxxxxxxx-xxxxxxxxxx-xxxxxxxxxxxx",
                "installation_type": "born_as_bot",
            },
        )
        integration.add_organization(organization)

        idp = IdentityProvider.objects.create(type="slack", external_id=external_id, config={})
        Identity.objects.create(
            external_id="UXXXXXXX1",
            idp=idp,
            user=self.user,
            status=IdentityStatus.VALID,
            scopes=[],
        )
        return integration

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

    def get_setting(
        self, provider: ExternalProviders, project: Optional[Project] = None
    ) -> NotificationSettingOptionValues:
        type = NotificationSettingTypes.ISSUE_ALERTS
        value = NotificationSetting.objects.get_settings(provider, type, user=self.user)
        if value != NotificationSettingOptionValues.DEFAULT:
            return value
        return _get_notification_setting_default(provider, type)

    def assert_settings(
        self, provider: ExternalProviders, value: NotificationSettingOptionValues
    ) -> None:
        assert self.get_setting(provider) == value
        assert self.get_setting(provider, project=self.project) == value

    def set_setting(
        self, provider: ExternalProviders, value: NotificationSettingOptionValues
    ) -> None:
        type = NotificationSettingTypes.ISSUE_ALERTS
        NotificationSetting.objects.update_settings(provider, type, value, user=self.user)
        NotificationSetting.objects.update_settings(
            provider, type, value, user=self.user, project=self.project
        )

    def test_uninstall_email_only(self):
        self.uninstall()

        self.assert_settings(ExternalProviders.EMAIL, NotificationSettingOptionValues.ALWAYS)
        self.assert_settings(ExternalProviders.SLACK, NotificationSettingOptionValues.NEVER)

    def test_uninstall_slack_and_email(self):
        self.set_setting(ExternalProviders.SLACK, NotificationSettingOptionValues.ALWAYS)

        self.uninstall()

        self.assert_settings(ExternalProviders.EMAIL, NotificationSettingOptionValues.ALWAYS)
        self.assert_settings(ExternalProviders.SLACK, NotificationSettingOptionValues.NEVER)

    def test_uninstall_slack_only(self):
        self.set_setting(ExternalProviders.EMAIL, NotificationSettingOptionValues.NEVER)
        self.set_setting(ExternalProviders.SLACK, NotificationSettingOptionValues.ALWAYS)

        self.uninstall()

        self.assert_settings(ExternalProviders.EMAIL, NotificationSettingOptionValues.NEVER)
        self.assert_settings(ExternalProviders.SLACK, NotificationSettingOptionValues.NEVER)

    def test_uninstall_with_multiple_organizations(self):
        organization = self.create_organization(owner=self.user)
        integration = self.create_integration(organization, "TXXXXXXX2")

        # TODO MARCOS FIRST do i even need notification settings?

        self.set_setting(ExternalProviders.EMAIL, NotificationSettingOptionValues.NEVER)
        self.set_setting(ExternalProviders.SLACK, NotificationSettingOptionValues.ALWAYS)

        self.uninstall()

        assert Integration.objects.filter(id=integration.id).exists()
        assert OrganizationIntegration.objects.filter(
            integration=integration, organization=organization
        ).exists()

        assert self.get_setting(ExternalProviders.EMAIL) == NotificationSettingOptionValues.NEVER
        assert self.get_setting(ExternalProviders.SLACK) == NotificationSettingOptionValues.NEVER
