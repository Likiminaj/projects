/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion_command_utils.c                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/22 17:56:27 by cpesty            #+#    #+#             */
/*   Updated: 2026/02/10 15:29:38 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		expand_var_ok(t_ast *ast, char *envp, char *var_name, int i);
int		expand_var_nok(t_ast *ast, char *var_name, int i);
void	swap_new(t_ast *ast, int i, char *new_ast);
int		find_index_in_env(char **envp, char *var_name);
char	*find_content(char *argument);

int	expand_var_ok(t_ast *ast, char *envp, char *n, int i)
{
	char	*cont;
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	cont = find_content(envp);
	if (cont == NULL)
		return (1);
	new_ast = malloc(ft_strlen(ast->args[i]) - ft_strlen(n) + ft_strlen(cont));
	if (!new_ast)
		return (1);
	j = 0;
	k = 0;
	while (ast->args[i][k] != '$')
		new_ast[j++] = ast->args[i][k++];
	len = ft_strlen(n) + k + 1;
	k = 0;
	while (cont[k] != '\0')
		new_ast[j++] = cont[k++];
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(ast, i, new_ast);
	return (free(cont), 0);
}

int	expand_var_nok(t_ast *ast, char *var_name, int i)
{
	char	*new_ast;
	int		j;
	int		k;
	int		len;

	new_ast = malloc(ft_strlen(ast->args[i]) - ft_strlen(var_name));
	if (!new_ast)
		return (1);
	len = ft_strlen(var_name);
	j = 0;
	k = 0;
	while (ast->args[i][k] != '$')
		new_ast[j++] = ast->args[i][k++];
	len += (k + 1);
	while (ast->args[i][len] != '\0')
		new_ast[j++] = ast->args[i][len++];
	new_ast[j] = '\0';
	swap_new(ast, i, new_ast);
	return (0);
}

void	swap_new(t_ast *ast, int i, char *new_ast)
{
	if (!new_ast)
		return ;
	free(ast->args[i]);
	ast->args[i] = new_ast;
}

/* Looks for a specific variable in the environement.
Returns the index of this variable in the env array. */
int	find_index_in_env(char **envp, char *var_name)
{
	int		i;
	size_t	var_len;		

	if (!envp || !var_name)
		return (-1);
	var_len = ft_strlen(var_name);
	if (var_len == 0)
		return (-1);
	i = 0;
	while (envp[i] != NULL)
	{
		if ((ft_strncmp(envp[i], var_name, var_len) == 0) \
&& envp[i][var_len] == '=')
			return (i);
		i++;
	}
	return (-1);
}

/* Receives an argument such as "var_name=content" and extracts
content only (after =). */
char	*find_content(char *argument)
{
	char	*equal_start;

	if (!argument)
		return (NULL);
	equal_start = ft_strchr(argument, '=');
	if (!equal_start)
		return (NULL);
	return (ft_strdup(equal_start + 1));
}
