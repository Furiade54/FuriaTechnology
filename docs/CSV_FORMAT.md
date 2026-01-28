# Formato de Importación de Productos (CSV)

Para la carga masiva de productos en el Panel de Administración, el archivo CSV debe cumplir estrictamente con el siguiente formato.

## Estructura del Archivo

El archivo debe usar **comas (`,`)** como delimitador.

### Cabeceras Obligatorias
La primera fila del archivo debe contener exactamente los siguientes nombres de columna (case-sensitive):
`ID,SKU,Name,Description,Price,Category,Image,Images,Specifications,IsFeatured,IsActive`

### Descripción de Campos

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
|-------|------|-------------|-------------|---------|
| `ID` | Texto/Num | No (Opcional) | Identificador interno. Si se deja vacío para nuevos productos, la BD lo genera. | `101` |
| `SKU` | Texto | **Sí** | Identificador único del producto (Stock Keeping Unit). | `PHN-001` |
| `Name` | Texto | **Sí** | Nombre del producto. | `iPhone 15 Pro` |
| `Description` | Texto | **Sí** | Descripción detallada del producto. | `El último iPhone con...` |
| `Price` | Número | **Sí** | Precio en pesos colombianos (COP). Sin símbolos de moneda. | `4500000` |
| `Category` | Texto | **Sí** | Nombre exacto de la categoría a la que pertenece. | `Celulares` |
| `Image` | URL | **Sí** | URL de la imagen principal. | `https://example.com/img1.jpg` |
| `Images` | JSON Array | No | Array de URLs para imágenes adicionales. | `["https://ex.com/2.jpg"]` |
| `Specifications` | JSON Object | No | Objeto JSON con pares clave-valor de especificaciones. | `{"Color":"Negro", "Memoria":"128GB"}` |
| `IsFeatured` | Bool | No | `true` para destacar en Home, `false` por defecto. | `true` |
| `IsActive` | Bool | No | `true` para mostrar en catálogo, `false` para ocultar. | `true` |

## Reglas de Formato Importantes

1. **Campos JSON (`Specifications`, `Images`)**:
   - Deben ser cadenas JSON válidas.
   - Si el JSON contiene comillas dobles `"` internas, estas deben escaparse duplicándolas `""` y todo el campo debe estar encerrado en comillas dobles.
   - **Ejemplo Incorrecto**: `{"Pantalla": "6.1""}`
   - **Ejemplo Correcto**: `"{""Pantalla"": ""6.1""""}"`

2. **Comas en el contenido**:
   - Si un valor de texto contiene comas (ej. descripción), todo el valor debe estar encerrado entre comillas dobles.
   - Ejemplo: `"Pantalla grande, batería duradera"`

3. **Valores Booleanos**:
   - Se aceptan `true`, `TRUE`, `1` como verdadero.
   - Cualquier otro valor se interpreta como falso.

## Ejemplo de Fila Válida

```csv
ID,SKU,Name,Description,Price,Category,Image,Images,Specifications,IsFeatured,IsActive
,TAB-001,Tablet X,Una tablet potente,1200000,Tablets,https://img.com/t.jpg,[],"{""Pantalla"":""10 pulg"",""RAM"":""4GB""}",true,true
```
