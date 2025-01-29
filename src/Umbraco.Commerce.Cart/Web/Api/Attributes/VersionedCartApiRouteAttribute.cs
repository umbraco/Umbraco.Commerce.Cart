using Umbraco.Cms.Web.Common.Routing;

namespace Umbraco.Commerce.Cart.Web.Api.Attributes;

internal sealed class VersionedCartApiRouteAttribute(string template)
    : BackOfficeRouteAttribute($"{Constants.BackOfficePath}/v{{version:apiVersion}}/{template.TrimStart('/')}");
