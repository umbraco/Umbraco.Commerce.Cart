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
public class RemoveCartItemUccApiController(IUmbracoCommerceApi umbracoCommerceApi) : UccApiControllerBase
{
    [HttpDelete("cart/{id:guid}")]
    [MapToApiVersion("1.0")]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveCartItem(
        [FromRoute] StoreSessionDto session,
        [FromRoute] Guid id,
        CancellationToken token = default)
    {
        var store = Guid.TryParse(session.Store, out var storeId)
            ? await umbracoCommerceApi.GetStoreAsync(storeId)
            : await umbracoCommerceApi.GetStoreAsync(session.Store);
        
        try
        {
            await umbracoCommerceApi.Uow.ExecuteAsync(async uow =>
            {
                var order = await umbracoCommerceApi.GetCurrentOrderAsync(store.Id)!
                    .AsWritableAsync(uow)
                    .RemoveOrderLineAsync(id);
                
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
