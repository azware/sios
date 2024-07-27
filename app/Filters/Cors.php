<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class Cors implements FilterInterface
{
    /**
     * @param array|null $arguments
     *
     * @return RequestInterface|ResponseInterface|string|void
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        /** @var ResponseInterface $response */
        $response = service('response');

        // Set your Origin.
        $response->setHeader('Access-Control-Allow-Origin', 'http://localhost:8081');

        // Set this header if the client sends Cookies.
        // $response->setHeader('Access-Control-Allow-Credentials', 'true');

        if ($request->is('OPTIONS')) {
            $response->setStatusCode(204);

            // Set headers to allow.
            $response->setHeader(
                'Access-Control-Allow-Headers',
                'X-API-KEY, X-Requested-With, Content-Type, Accept, Authorization'
            );

            // Set methods to allow.
            $response->setHeader(
                'Access-Control-Allow-Methods',
                'GET, POST, OPTIONS, PUT, PATCH, DELETE'
            );

            // Set how many seconds the results of a preflight request can be cached.
            $response->setHeader('Access-Control-Max-Age', '3600');

            return $response;
        }
    }

    /**
     * @param array|null $arguments
     *
     * @return ResponseInterface|void
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}