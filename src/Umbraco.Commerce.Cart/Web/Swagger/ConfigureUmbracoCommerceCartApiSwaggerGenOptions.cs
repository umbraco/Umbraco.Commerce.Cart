using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Api.Common.OpenApi;

namespace Umbraco.Commerce.Cart.Web.Swagger;

public class ConfigureUmbracoCommerceCartApiSwaggerGenOptions : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        options.SwaggerDoc(
            Constants.ApiName,
            new OpenApiInfo
            {
                Title = Constants.ApiTitle,
                Version = "Latest",
                Description = $"Describes the ${Constants.ApiTitle}.",
            });

        options.DocumentFilter<MimeTypeDocumentFilter>(Constants.ApiName);
    }
}