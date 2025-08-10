<!doctype html>
<html lang="es">
    <cabeza>
        <meta charset="utf-8" />
        <meta name="viewport" content="ancho=ancho-del-dispositivo, escala-inicial=1" />
        <meta name="color del tema" contenido="#000000" />
        <meta name="description" content="Un producto de emergent.sh" />
        <!--
      manifest.json proporciona metadatos que se utilizan cuando su aplicación web se instala en un
      Dispositivo móvil o computadora del usuario. Consulte https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
        <!--
      Observe el uso de %PUBLIC_URL% en las etiquetas anteriores.
      Se reemplazará con la URL de la carpeta "pública" durante la compilación.
      Sólo se puede hacer referencia desde el HTML a los archivos dentro de la carpeta «pública».

      A diferencia de "/favicon.ico" o "favicon.ico", "%PUBLIC_URL%/favicon.ico"
      Funciona correctamente tanto con enrutamiento del lado del cliente como con una URL pública que no sea raíz.
      Aprenda a configurar una URL pública no raíz ejecutando `npm run build`.
    -->
        Emergente | Aplicación Fullstack
    </cabeza>
    <cuerpo>
        <noscript>Debes habilitar JavaScript para ejecutar esta aplicación.</noscript>
        <div id="raíz"></div>
        <!--
      Este archivo HTML es una plantilla.
      Si lo abres directamente en el navegador, verás una página vacía.

      Puede agregar fuentes web, metaetiquetas o análisis a este archivo.
      El paso de compilación colocará los scripts incluidos en la etiqueta <body>.

      Para comenzar el desarrollo, ejecute `npm start` o `yarn start`.
      Para crear un paquete de producción, utilice `npm run build` o `yarn build`.
    -->
        <a
            id="insignia emergente"
            objetivo="_en blanco"
            href="https://app.emergent.sh/?utm_source=emergent-badge"
            estilo="
                pantalla: flex !importante;
                alinear-elementos: centro !importante;
                posición: fija !importante;
                abajo: 20px;
                derecha: 20px;
                decoración de texto: ninguna;
                relleno: 6px 10px;
                familia de fuentes: -apple-system, BlinkMacSystemFont,
                    "Segoe UI", Roboto, Oxígeno, Ubuntu, Cantarell,
                    "Open Sans", "Helvetica Neue",
                    ¡sans-serif! importante;
                tamaño de fuente: 12px !importante;
                índice z: 9999 !importante;
                caja-sombra: 0 2px 8px rgba(0, 0, 0, 0.15) !importante;
                radio del borde: 8px !importante;
                color de fondo: #ffffff !importante;
                borde: 1px sólido rgba(255, 255, 255, 0.25) !importante;
            "
        >
            <división
                estilo="mostrar: flex; dirección-flexible: fila; elementos-alineados: centro"
            >
                <imagen
                    estilo="ancho: 20px; alto: 20px; margen derecho: 8px"
                    Fuente: https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4
                />
                <p
                    estilo="
                        color: #000000;
                        familia de fuentes: -apple-system, BlinkMacSystemFont,
                            "Segoe UI", Roboto, Oxígeno, Ubuntu,
                            Cantarell, "Open Sans",
                            "Helvetica Neue", sans-serif !importante;
                        tamaño de fuente: 12px !importante;
                        alinear-elementos: centro;
                        margen inferior: 0;
                    "
                >
                    Hecho con Emergent
                </p>
            </div>
        </a>
        <guión>
            !(función (t, e) {
                var o, n, p, r;
                e.__SV ||
                    ((ventana.posthog = e),
                    (e._i = []),
                    (e.init = función (i, s, a) {
                        función g(t, e) {
                            var o = e.split(".");
                            2 == o.longitud && ((t = t[o[0]]), (e = o[1])),
                                (t[e] = función () {
                                    t.push(
                                        [e].concat(
                                            Matriz.prototipo.slice.call(
                                                argumentos,
                                                0,
                                            ),
                                        ),
                                    );
                                });
                        }
                        ((p = t.createElement("script")).tipo =
                            "texto/javascript"),
                            (p.crossOrigin = "anónimo"),
                            (p.async = !0),
                            (p.src =
                                s.api_host.replace(
                                    ".i.posthog.com",
                                    "-activos.i.posthog.com",
                                ) + "/static/array.js"),
                            (r =
                                t.getElementsByTagName(
                                    "guion",
                                )[0]).parentNode.insertBefore(p, r);
                        var u = e;
                        para (
                            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
                                u.gente = u.gente || [],
                                u.toString = función (t) {
                                    var e = "posthog";
                                    devolver (
                                        "posthog" !== a && (e += "." + a),
                                        t || (e += " (stub)"),
                                        mi
                                    );
                                },
                                u.people.toString = función () {
                                    devuelve u.toString(1) + ".people (stub)";
                                },
                                o =
                                    "iniciar mi ws ys ps bs capturar je Di ks registrar registrar_una vez registrar_para_sesión cancelar registro cancelar_para_sesión Ps obtenerIndicadorDeCaracterística obtenerCargaÚtilDeIndicadorDeCaracterística estáHabilitada la Característica recargarIndicadoresDeCaracterística actualizarInscripciónDeCaracterísticaDeAccesoAnticipado obtenerCaracterísticasDeAccesoAnticipado en enIndicadoresDeCaracterística enEncuestasCargadas enIdDeSesión obtenerEncuestas obtenerEncuestasDeCoincidenciaActiva renderizarEncuesta puedeRenderizarEncuesta puedeRenderizarEncuestaAsync identificar establecerPropiedadesDePersona grupo restablecerGrupos establecerPropiedadesDePersonaParaIndicadores restablecerPropiedadesDePersonaParaIndicadores establecerPropiedadesDeGrupoParaIndicadores restablecerPropiedadesDeGrupoParaIndicadores restablecer obtener_id_distinto obtenerGrupos obtener_id_de_sesión obtener_url_de_reproducción_de_sesión alias establecer_configuración iniciarGrabaciónDeSesión detenerGrabaciónDeSesión grabaciónDeSesiónIniciada capturaExcepción cargarBarraDeHerramientas obtener_propiedadobtenerPropiedadDeSesión Es $s crearPerfilDePersona Es optar_entrar_capturar optar_salir_capturar ha_optado_entrar_captura ha_optado_salir_capturar borrar_opt_entrar_salir_capturar Ss depurar xs obtenerIdDeVistaDePágina capturarRetroalimentaciónDeTrace capturaMétricaDeTrace".split(
                                        " ",
                                    ),
                                n = 0;
                            n < o.longitud;
                            n++
                        )
                            g(u, o[n]);
                        e._i.push([i, s, a]);
                    }),
                    (e.__SV = 1));
            })(documento, ventana.posthog || []);
            posthog.init("phc_yJW1VjHGGwmCbbrtczfqqNxgBDbhlhOWcdzcIJEOTFE", {
                api_host: "https://us.i.posthog.com",
                person_profiles: "identified_only", // o 'siempre' para crear perfiles también para usuarios anónimos
            });
        </script>
    </cuerpo>
</html>
