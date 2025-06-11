using Microsoft.AspNetCore.Mvc;
using Umbraco.Commerce.Extensions;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Umbraco.Commerce.Cart.Web.Api.Attributes;
using Umbraco.Commerce.Cart.Web.Api.Models;
using Umbraco.Commerce.Common.Validation;
using Umbraco.Commerce.Core.Api;

namespace Umbraco.Commerce.Cart.Web.Api.Controllers;

[ApiVersion("1.0")]
[VersionedCartApiRoute("session")]
[ApiExplorerSettings(GroupName = "Session")]
public class AddToCartUccApiController(IUmbracoCommerceApi umbracoCommerceApi) : UccApiControllerBase
{
    private static readonly Dictionary<string, string> EMPTY_PROPERTIES = new();
    
    [HttpPost("cart")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddToCart(
        [FromRoute] StoreSessionDto session,
        [FromBody] AddToCartRequestDto model,
        CancellationToken token = default)
    {
        var store = Guid.TryParse(session.Store, out var storeId)
            ? await umbracoCommerceApi.GetStoreAsync(storeId)
            : await umbracoCommerceApi.GetStoreAsync(session.Store);
        
        try
        {
            await umbracoCommerceApi.Uow.ExecuteAsync(async uow =>
            {
                // If we have bundle items, enforce a bundle reference
                var bundleReference = model.BundleItems is { Count: > 0 } 
                    ? model.BundleReference ?? Guid.NewGuid().ToString() 
                    : model.BundleReference;
                
                var order = await umbracoCommerceApi.GetOrCreateCurrentOrderAsync(store.Id)!
                    .AsWritableAsync(uow)
                    .AddProductAsync(
                        model.ProductReference, 
                        model.ProductVariantReference, 
                        model.Quantity ?? 1,
                        model.Properties ?? EMPTY_PROPERTIES,
                        bundleReference);

                if (model.BundleItems is { Count: > 0 })
                {
                    foreach (var bundleItem in model.BundleItems)
                    {
                        await order.AddProductToBundleAsync(
                            bundleReference, 
                            bundleItem.ProductReference, 
                            bundleItem.Quantity ?? 1,
                            bundleItem.Properties ?? EMPTY_PROPERTIES);
                    }
                }
                
                await umbracoCommerceApi.SaveOrderAsync(order, token);
                
                uow.Complete();
            }, token);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
        
        return Ok(null);
    }
}
