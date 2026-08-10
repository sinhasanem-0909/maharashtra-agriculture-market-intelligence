function renderProducts() {
  const target = document.querySelector("#products");
  const formGroups = [
    ["Raw", "rawForms"],
    ["Processed", "processedForms"],
    ["Intermediate / Industrial", "intermediateIndustrialForms"],
    ["By-product / Waste", "byproducts"]
  ];

  const rows = state.products.flatMap((product) =>
    formGroups.flatMap(([formType, field]) =>
      (product[field] || []).map((form) => ({
        product: product.product,
        districts: product.districts || [],
        formType,
        form,
        institutionAnchors: product.institutionAnchors || [],
        buyerCategories: product.buyerCategories || [],
        infrastructureNeeds: product.infrastructureNeeds || []
      }))
    )
  );

  target.innerHTML = `
    <div class="section-title">
      <div>
        <h3>Product Intelligence & Value-Chain Explorer</h3>
        <p>One row per product form. Product intelligence defines the research universe; market evidence validates the opportunity.</p>
      </div>
    </div>
    <div class="table-wrap product-intelligence-table">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Districts</th>
            <th>Form Type</th>
            <th>Form</th>
            <th>Institution Anchors</th>
            <th>Buyer Categories</th>
            <th>Infrastructure Needs</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => `
            <tr>
              <td><strong>${escapeHtml(row.product)}</strong></td>
              <td>${row.districts.map((district) => `<span class="tag">${escapeHtml(district)}</span>`).join(" ")}</td>
              <td><span class="badge">${escapeHtml(row.formType)}</span></td>
              <td><strong>${escapeHtml(row.form)}</strong></td>
              <td>${escapeHtml(row.institutionAnchors.join(", "))}</td>
              <td>${escapeHtml(row.buyerCategories.join(", "))}</td>
              <td>${escapeHtml(row.infrastructureNeeds.join(", "))}</td>
            </tr>
          `).join("") : `<tr><td colspan="7">No product intelligence records available.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
