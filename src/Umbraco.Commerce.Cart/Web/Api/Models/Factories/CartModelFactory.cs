using Umbraco.Commerce.Core.Api;
using Umbraco.Commerce.Core.Models;
using Umbraco.Commerce.Extensions;

namespace Umbraco.Commerce.Cart.Web.Api.Models.Factories;

internal static class CartModelFactory
{
    internal static async Task<CartDto> EntityToDtoAsync(MappingContext ctx, OrderReadOnly entity)
    {
        // Show the subtotal before any discounts are applied so it reconciles with the cart's
        // item line prices, which are also shown without adjustments. Discounts are surfaced
        // during the checkout flow, not in the cart (see issue #847).
        var subtotal = await entity.SubtotalPrice.WithoutAdjustments.FormattedAsync();

        return new CartDto
        {
            Id = entity.Id,
            Items = await entity.OrderLines.SelectAsync(async x =>
            {
                var ol = await ItemEntityToDtoAsync(ctx, x, new BundlableCartItemDto());

                if (x.IsBundle(out var bundleOrderLineReadOnly))
                {
                    var basePrice = await bundleOrderLineReadOnly.BasePrice.WithoutAdjustments.FormattedAsync();
                    
                    ol.BundleReference = bundleOrderLineReadOnly.BundleId;
                    ol.Items = await bundleOrderLineReadOnly.OrderLines
                        .SelectAsync(async y => await ItemEntityToDtoAsync(ctx, y, new CartItemDto()));
                    ol.BasePrice = new FormattedPriceDto
                    {
                        WithTax = basePrice.WithTax,
                        Tax = basePrice.Tax,
                        WithoutTax = basePrice.WithoutTax
                    };
                }
                
                return ol;
            }),
            Subtotal = new FormattedPriceDto
            {
                WithTax = subtotal.WithTax,
                Tax = subtotal.Tax,
                WithoutTax = subtotal.WithoutTax
            }
        };
    }
    
    private static async Task<T> ItemEntityToDtoAsync<T>(MappingContext ctx, OrderLineReadOnly entity, T dto)
        where T : CartItemDto
    {
        var unitPrice = await entity.UnitPrice.WithoutAdjustments.FormattedAsync();
        var total = await entity.TotalPrice.WithoutAdjustments.FormattedAsync();

        dto.Id = entity.Id;
        dto.ProductReference = entity.ProductReference;
        dto.ProductVariantReference = entity.ProductVariantReference;
        dto.Sku = entity.Sku;
        dto.Name = entity.Name;
        dto.UnitPrice = new FormattedPriceDto
        {
            WithTax = unitPrice.WithTax,
            Tax = unitPrice.Tax,
            WithoutTax = unitPrice.WithoutTax
        };
        dto.Quantity = entity.Quantity;
        dto.Total = new FormattedPriceDto
        {
            WithTax = total.WithTax,
            Tax = total.Tax,
            WithoutTax = total.WithoutTax
        };
        dto.Properties = entity.Properties.Where(y => !y.Value.IsServerSideOnly)
            .ToDictionary(y => y.Key, y => y.Value.Value);
        dto.Attributes = entity.Attributes.ToDictionary(y => y.Name.Name, y => y.Value.Name);
        
        var product = await ctx.UmbracoCommerceApi.GetProductAsync(entity.StoreId, entity.ProductReference, entity.ProductVariantReference);
        if (product is IProductSnapshotWithImage productWithImage)
        {
            dto.ImageUrl = productWithImage.ImageUrl;
        }
        
        return dto;
    }
}