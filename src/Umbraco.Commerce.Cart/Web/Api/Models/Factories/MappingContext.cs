using Microsoft.Extensions.DependencyInjection;
using Umbraco.Commerce.Core.Api;

namespace Umbraco.Commerce.Cart.Web.Api.Models.Factories;

public class MappingContext(IServiceProvider serviceProvider)
{
    public IUmbracoCommerceApi UmbracoCommerceApi => serviceProvider.GetRequiredService<IUmbracoCommerceApi>();
}