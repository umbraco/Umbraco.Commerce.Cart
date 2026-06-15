using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Commerce.Core;
using Umbraco.Commerce.Extensions;

namespace Umbraco.Commerce.Cart.DependencyInjection;

public static class UmbracoCommerceBuilderExtensions
{
    public static IUmbracoCommerceBuilder AddUmbracoCommerceCart(this IUmbracoCommerceBuilder builder)
    {
        builder.WithUmbracoBuilder().AddBackOfficeOpenApiDocument(
            Constants.ApiName,
            document => document
                .WithTitle(Constants.ApiTitle)
                .ConfigureOpenApiOptions(options =>
                {
                    options.AddDocumentTransformer((doc, _, _) =>
                    {
                        doc.Info.Version = "Latest";
                        doc.Info.Description = $"Describes the {Constants.ApiTitle}.";
                        return Task.CompletedTask;
                    });
                }));

        return builder;
    }
}