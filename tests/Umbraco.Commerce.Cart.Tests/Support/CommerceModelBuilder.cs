using System.Reflection;
using Moq;
using Umbraco.Commerce.Common;
using Umbraco.Commerce.Core.Cache;
using Umbraco.Commerce.Core.Models;
using Umbraco.Commerce.Core.Services;

namespace Umbraco.Commerce.Cart.Tests.Support;

/// <summary>
/// Builds real Commerce order models for tests. The Commerce state and read-only entity
/// constructors are internal, so they are created through reflection.
/// </summary>
internal static class CommerceModelBuilder
{
    public static readonly Guid StoreId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private const BindingFlags AnyInstance = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;

    public static CurrencyReadOnly CreateCurrency(Guid id, string cultureName, string formatTemplate)
    {
        var state = Construct<CurrencyState>(StoreId, id, true);
        Set(state, nameof(CurrencyState.CultureName), cultureName);
        Set(state, nameof(CurrencyState.FormatTemplate), formatTemplate);

        return Construct<CurrencyReadOnly>(state);
    }

    public static OrderBuilder Order(Guid currencyId) => new(currencyId);

    public static Price Price(decimal withoutTax, decimal tax, Guid currencyId)
        => new(withoutTax, tax, currencyId);

    internal static T Construct<T>(params object[] args)
        => (T)Activator.CreateInstance(typeof(T), AnyInstance, null, args, null)!;

    internal static void Set(object target, string property, object? value)
        => target.GetType().GetProperty(property, AnyInstance)!.SetValue(target, value);

    internal sealed class OrderBuilder(Guid currencyId)
    {
        private readonly Guid _orderId = Guid.NewGuid();
        private readonly List<OrderLineBuilder> _lines = [];
        private Price? _subtotalWithoutAdjustments;
        private Price? _subtotalValue;

        public Guid CurrencyId => currencyId;

        public OrderBuilder WithSubtotal(Price withoutAdjustments, Price? discountedValue = null)
        {
            _subtotalWithoutAdjustments = withoutAdjustments;
            _subtotalValue = discountedValue ?? withoutAdjustments;
            return this;
        }

        public OrderBuilder WithLine(Action<OrderLineBuilder> configure)
        {
            var line = new OrderLineBuilder(_orderId, currencyId);
            configure(line);
            _lines.Add(line);
            return this;
        }

        public OrderReadOnly Build()
        {
            var state = Construct<OrderState>(StoreId, _orderId, currencyId, true);

            if (_subtotalWithoutAdjustments != null)
            {
                var subtotal = OrderSubtotalPrice.ZeroValue(currencyId);
                subtotal.WithoutAdjustments = _subtotalWithoutAdjustments;
                subtotal.Value = _subtotalValue!;
                Set(state, nameof(OrderState.SubtotalPrice), subtotal.AsReadOnly());
            }

            state.OrderLines.AddRange(_lines.Select(x => x.BuildState()));

            return Construct<OrderReadOnly>(state);
        }
    }

    internal sealed class OrderLineBuilder(Guid orderId, Guid currencyId)
    {
        private readonly List<OrderLineBuilder> _children = [];
        private readonly Guid _id = Guid.NewGuid();

        public string ProductReference { get; set; } = "product-1";
        public string? ProductVariantReference { get; set; }
        public string Sku { get; set; } = "SKU-1";
        public string Name { get; set; } = "Product 1";
        public decimal Quantity { get; set; } = 1;
        public string? BundleId { get; set; }
        public Guid? ParentOrderLineId { get; set; }
        public Guid Id => _id;

        public Price? UnitPrice { get; set; }
        public Price? UnitPriceValue { get; set; }
        public Price? TotalPrice { get; set; }
        public Price? TotalPriceValue { get; set; }
        public Price? BasePrice { get; set; }
        public Price? BasePriceValue { get; set; }

        public Dictionary<string, PropertyValue> Properties { get; } = [];
        public List<AttributeCombination> Attributes { get; } = [];

        public OrderLineBuilder WithChild(Action<OrderLineBuilder> configure)
        {
            var child = new OrderLineBuilder(orderId, currencyId)
            {
                ParentOrderLineId = _id,
            };
            configure(child);
            _children.Add(child);
            return this;
        }

        public OrderLineState BuildState()
        {
            var state = Construct<OrderLineState>(StoreId, orderId, currencyId, _id);
            Set(state, nameof(OrderLineState.ProductReference), ProductReference);
            Set(state, nameof(OrderLineState.ProductVariantReference), ProductVariantReference);
            Set(state, nameof(OrderLineState.Sku), Sku);
            Set(state, nameof(OrderLineState.Name), Name);
            Set(state, nameof(OrderLineState.Quantity), Quantity);
            Set(state, nameof(OrderLineState.BundleId), BundleId);
            Set(state, nameof(OrderLineState.ParentOrderLineId), ParentOrderLineId);

            // A line is "bundled" when it has a parent bundle id
            if (ParentOrderLineId.HasValue)
            {
                Set(state, nameof(OrderLineState.ParentBundleId), "bundle-parent");
            }

            foreach (var property in Properties)
            {
                state.Properties.Add(property.Key, property.Value);
            }

            state.Attributes.AddRange(Attributes);

            if (UnitPrice != null)
            {
                var unit = OrderLineUnitPrice.ZeroValue(currencyId);
                unit.WithoutAdjustments = UnitPrice;
                unit.Value = UnitPriceValue ?? UnitPrice;
                state.UnitPrice = unit.AsReadOnly();
            }

            if (TotalPrice != null)
            {
                var total = OrderLineTotalPrice.ZeroValue(currencyId);
                total.WithoutAdjustments = TotalPrice;
                total.Value = TotalPriceValue ?? TotalPrice;
                state.TotalPrice = total.AsReadOnly();
            }

            if (BasePrice != null)
            {
                var basePrice = OrderLineBasePrice.ZeroValue(currencyId);
                basePrice.WithoutAdjustments = BasePrice;
                basePrice.Value = BasePriceValue ?? BasePrice;
                state.BasePrice = basePrice.AsReadOnly();
            }

            state.OrderLines.AddRange(_children.Select(x => x.BuildState()));

            return state;
        }
    }

    /// <summary>
    /// Points Commerce's internal service locator at a factory that can resolve the currency
    /// formatter's dependencies. Restores the previous factory on dispose.
    /// </summary>
    internal sealed class CurrencyServices : IDisposable
    {
        private static readonly PropertyInfo FactoryProperty = typeof(IFactory).Assembly
            .GetType("Umbraco.Commerce.Common.ServiceLocator")!
            .GetProperty("Factory", BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)!;

        private readonly object? _originalFactory = FactoryProperty.GetValue(null);

        public CurrencyServices(CurrencyReadOnly currency)
        {
            var currencyService = new Mock<ICurrencyService>();
            currencyService.Setup(x => x.GetCurrencyAsync(currency.Id)).ReturnsAsync(currency);

            var factory = new Mock<IFactory>();
            factory.Setup(x => x.GetInstance<ICache>()).Returns(Mock.Of<ICache>());
            factory.Setup(x => x.GetInstance<ICurrencyService>()).Returns(currencyService.Object);

            FactoryProperty.SetValue(null, factory.Object);
        }

        public void Dispose() => FactoryProperty.SetValue(null, _originalFactory);
    }
}
