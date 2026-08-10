function renderProducts() {
  const target = document.querySelector("#products");
  const formGroups = [
    ["Raw", "rawForms"],
    ["Processed", "processedForms"],
    ["Intermediate / Industrial", "intermediateIndustrialForms"],
    ["By-product / Waste", "byproducts"]
  ];

  const rows = state.products.flatMap((product) => {
    const forms = formGroups.flatMap(([formType, field]) =>
      (product[field] || []).map((form) => ({ formType, form }))
    );
    const rowspan = Math.max(forms.length, 1);

    if (!forms.length) {
      return [`
        <tr>
          <td rowspan="1" class="product-cell"><strong>${escapeHtml(product.product)}</strong></td>
          <td>${(product.districts || []).map((district) => `<span class="tag">${escapeHtml(district)}</span>`).join(" ")}</td>
          <td>—</td>
          <td>—</td>
          <td>${escapeHtml((product.institutionAnchors || []).join(", "))}</td>
          <td>${escapeHtml((product.buyerCategories || []).join(", "))}</td>
          <td>${escapeHtml((product.infrastructureNeeds || []).join(", "))}</td>
        </tr>`];
    }

    return forms.map(({ formType, form }, index) => `
      <tr>
        ${index === 0 ? `<td rowspan="${rowspan}" class="product-cell"><strong>${escapeHtml(product.product)}</strong></td>` : ""}
        ${index === 0 ? `<td rowspan="${rowspan}" class="product-cell">${(product.districts || []).map((district) => `<span class="tag">${escapeHtml(district)}</span>`).join(" ")}</td>` : ""}
        <td><span class="badge">${escapeHtml(formType)}</span></td>
        <td><strong>${escapeHtml(form)}</strong></td>
        ${index === 0 ? `<td rowspan="${rowspan}" class="product-cell">${escapeHtml((product.institutionAnchors || []).join(", "))}</td>` : ""}
        ${index === 0 ? `<td rowspan="${rowspan}" class="product-cell">${escapeHtml((product.buyerCategories || []).join(", "))}</td>` : ""}
        ${index === 0 ? `<td rowspan="${rowspan}" class="product-cell">${escapeHtml((product.infrastructureNeeds || []).join(", "))}</td>` : ""}
      </tr>
    `);
  }).join("");

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
          ${rows || `<tr><td colspan="7">No product intelligence records available.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
