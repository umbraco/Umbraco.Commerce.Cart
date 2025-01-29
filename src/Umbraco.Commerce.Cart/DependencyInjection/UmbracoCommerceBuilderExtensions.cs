using Microsoft.Extensions.DependencyInjection;
using Umbraco.Commerce.Cart.Web.Swagger;
using Umbraco.Commerce.Core;

namespace Umbraco.Commerce.Cart.DependencyInjection;

public static class UmbracoCommerceBuilderExtensions
{
    public static IUmbracoCommerceBuilder AddUmbracoCommerceCart(this IUmbracoCommerceBuilder builder)
    {
        builder.Services.ConfigureOptions<ConfigureUmbracoCommerceCartApiSwaggerGenOptions>();
        
        return builder;
    }
}